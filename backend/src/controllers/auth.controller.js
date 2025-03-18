import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });

    if (user) return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      // generate jwt token here
      generateToken(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    console.log("Logging in user with email:", email);
    const user = await User.findOne({ email });

    if (!user) {
      console.log("User not found");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log("User found");

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      console.log("Invalid password");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log("Password is correct");

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("Error in login controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { nickname, bio, country, city } = req.body;
    const userId = req.user._id;
    let profilePic = req.user.profilePic;

    if (req.file) {
      const uploadResponse = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { resource_type: "auto" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(req.file.buffer);
      });
      profilePic = uploadResponse.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        profilePic,
        nickname,
        bio,
        country,
        city,
      },
      { new: true }
    );
    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const getFriendsANDFriendRequest = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate('friends', 'fullName email profilePic').populate('friendRequests', 'fullName email profilePic');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ friends: user.friends, friendRequests: user.friendRequests });
  } catch (error) {
    console.log("Error in getFriendsANDFriendRequest controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const sendFriendRequest = async (req, res) => {
  try {
    const { friendId } = req.body;
    const userId = req.user._id;

    if (!friendId) {
      return res.status(400).json({ message: "Friend ID is required" });
    }

    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.friendRequests.includes(friendId) || friend.friendRequests.includes(userId)) {
      return res.status(400).json({ message: "Friend request already sent" });
    }

    friend.friendRequests.push(userId);
    await friend.save();

    res.status(200).json({ message: "Friend request sent successfully" });
  } catch (error) {
    console.log("Error in sendFriendRequest controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    const { friendId } = req.body;
    const userId = req.user._id;
    console.log(`friendId: ${friendId}, userId: ${userId}`);

    if (!friendId) {
      return res.status(400).json({ message: "Friend ID is required" });
    }

    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.friendRequests.includes(friendId)) {
      return res.status(400).json({ message: "No friend request found" });
    }

    user.friends.push(friendId);
    friend.friends.push(userId);

    user.friendRequests = user.friendRequests.filter(id => id.toString() !== friendId);
    await user.save();
    await friend.save();

    res.status(200).json({ message: "Friend request accepted successfully" });
  } catch (error) {
    console.log("Error in acceptFriendRequest controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const declineFriendRequest = async (req, res) => {
  try {
    const { friendId } = req.body;
    const userId = req.user._id;

    if (!friendId) {
      return res.status(400).json({ message: "Friend ID is required" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.friendRequests.includes(friendId)) {
      return res.status(400).json({ message: "No friend request found" });
    }

    user.friendRequests = user.friendRequests.filter(id => id.toString() !== friendId);
    await user.save();

    res.status(200).json({ message: "Friend request declined successfully" });
  } catch (error) {
    console.log("Error in declineFriendRequest controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate('history', 'fullName email profilePic');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.history);
    console.log(user.history);
  } catch (error) {
    console.log("Error in getChatHistory controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const addChatHistory = async (req, res) => {
  try {
    const { friendId } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    const friend = await User.findById(friendId);
    if (!user || !friend) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.history.includes(friendId)) {
      user.history.push(friendId);
      await user.save();
    }

    if (!friend.history.includes(userId)) {
      friend.history.push(userId);
      await friend.save();
    }

    res.status(200);
  } catch (error) {
    console.log("Error in addChatHistory controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};