import express from "express";
import {
    checkAuth,
    login,
    logout,
    signup,
    updateProfile,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    getChatHistory,
    addChatHistory,
    getFriendsANDFriendRequest,
} from "../controllers/auth.controller.js";

import { protectRoute } from "../middleware/auth.middleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.put("/update-profile", protectRoute, upload.single('profilePic'), updateProfile);

router.get("/users-friend", protectRoute, getFriendsANDFriendRequest);
router.post("/send-friend-request", protectRoute, sendFriendRequest);
router.post("/accept-friend-request", protectRoute, acceptFriendRequest);
router.post("/decline-friend-request", protectRoute, declineFriendRequest);
router.get("/chat-history", protectRoute, getChatHistory);
router.post("/add-chat-history", protectRoute, addChatHistory);

router.get("/check-auth", protectRoute, checkAuth);
export default router;

