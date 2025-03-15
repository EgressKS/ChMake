import { useState, useEffect } from "react";
import { Search, MessageCircle, UserMinus, Check, X } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

const FriendsPage = () => {
  const [search, setSearch] = useState("");
  const [selectedFriend, setSelectedFriend] = useState(null);

  const { getFriends, userFriend, userFriendRequest, isUsersLoading } = useChatStore();
  const { acceptFriendRequest, declineFriendRequest, onlineUsers } = useAuthStore();

  useEffect(() => {
    getFriends();
  }, [getFriends]);

  const handleAccept = async (friendId) => {
    await acceptFriendRequest(friendId);
    getFriends(); // Refresh the friends and friend requests list
  };

  const handleDecline = async (friendId) => {
    await declineFriendRequest(friendId);
    getFriends(); // Refresh the friends and friend requests list
  };

  const handleFriendClick = (friend) => {
    setSelectedFriend(friend);
  };

  const filteredFriends = userFriend.filter((friend) =>
    friend.fullName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pt-20 min-h-screen px-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Friends</h1>

      {/* Search Bar */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search friends..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border bg-base-200 focus:outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Conditional Rendering */}
      {selectedFriend ? (
        <div className="bg-base-300 p-6 rounded-lg shadow-lg">
          <button onClick={() => setSelectedFriend(null)} className="mb-4 text-blue-500">Back to Friends List</button>
          <div className="flex items-center gap-4">
            <img src={selectedFriend.profilePic || "/avatar.png"} alt={selectedFriend.fullName} className="w-20 h-20 rounded-full object-cover" />
            <div>
              <h2 className="text-xl font-semibold">{selectedFriend.fullName}</h2>
              <p className="text-sm text-gray-500">Nickname: {selectedFriend.nickname || "NA"}</p>
              <p className="text-sm text-gray-500">Country: {selectedFriend.country || "NA"}</p>
              <p className="text-sm text-gray-500">City: {selectedFriend.city || "NA"}</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Friends List */}
          <div className="bg-base-300 p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Your Friends</h2>
            {isUsersLoading ? (
              <p className="text-center text-gray-500">Loading...</p>
            ) : (
              <div className="space-y-4">
                {filteredFriends.length === 0 ? (
                  <p className="text-center text-gray-500">User not found.</p>
                ) : (
                  filteredFriends.map((friend) => (
                    <div key={friend._id} className="flex items-center justify-between p-2 bg-base-200 rounded-lg cursor-pointer" onClick={() => handleFriendClick(friend)}>
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img src={friend.profilePic || "/avatar.png"} alt={friend.fullName} className="w-12 h-12 rounded-full object-cover" />
                          {onlineUsers.includes(friend._id) && (
                            <span className="absolute bottom-1 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white" />
                          )}
                        </div>
                        <p className="text-sm font-medium">{friend.fullName}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"><MessageCircle size={18} /></button>
                        <button className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"><UserMinus size={18} /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Friend Requests */}
          <div className="bg-base-300 p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Friend Requests</h2>
            <div className="space-y-4">
              {userFriendRequest.length === 0 ? (
                <p className="text-center text-gray-500">No pending friend requests.</p>
              ) : (
                userFriendRequest.map((req) => (
                  <div key={req._id} className="flex items-center justify-between p-2 bg-base-200 rounded-lg">
                    <div className="flex items-center gap-4">
                      <img src={req.profilePic || "/avatar.png"} alt={req.fullName} className="w-12 h-12 rounded-full object-cover" />
                      <p className="text-sm font-medium">{req.fullName}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg" onClick={() => handleAccept(req._id)}><Check size={18} /></button>
                      <button className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg" onClick={() => handleDecline(req._id)}><X size={18} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FriendsPage;