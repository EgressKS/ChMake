import { useEffect, useState, useCallback } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";

const Sidebar = ({ CurrentTypeOfChat, isChatsActive, setIsChatsActive }) => {
  const { getUsers, getFriends, userFriend, selectedUser, getRandomUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers, addChatHistory } = useAuthStore();
  const { theme } = useTheme();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showFriendChat, setShowFriendChat] = useState(false);
  const [showRandomChat, setShowRandomChat] = useState(true);
  const [isRandomBgColor, setIsRandomBgColor] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    getUsers();
    getFriends();
  }, [getUsers, getFriends]);

  const filteredUsers = useCallback(() => {
    return userFriend.filter(
      (user) =>
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (!showOnlineOnly || onlineUsers.includes(user._id))
    );
  }, [userFriend, searchQuery, showOnlineOnly, onlineUsers]);

  const handleGetRandomUser = async () => {
    setIsChatsActive(true);
    const randomUser = await getRandomUser();
    if (randomUser) {
      await addChatHistory(randomUser._id);
    }
  };

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <div className={`${isChatsActive ?  "hidden" : "h-full w-full flex" }  md:w-80 md:flex border-r border-gray-300 flex-col transition-all duration-300 p-3 shadow-md rounded-lg overflow-y-auto`}>
      <div className="flex justify-center gap-4 p-2 bg-base-200 rounded-lg">
        <button
          onClick={() => {
            setShowRandomChat(true);
            setShowFriendChat(false);
            setIsRandomBgColor(true);
            CurrentTypeOfChat("random");
            setSelectedUser(null);
          }}
          className={`px-4 py-2 rounded-lg shadow-md transition duration-300 transform hover:scale-105 ${
            isRandomBgColor ? "bg-base-200 border " : ""
          }`}
        >
          Random Chat
        </button>
        <button
          onClick={() => {
            setShowFriendChat(true);
            setShowRandomChat(false);
            setIsRandomBgColor(false);
            CurrentTypeOfChat("friend");
            setIsChatsActive(false);
            setSelectedUser(null);
          }}
          className={`px-4 py-2 rounded-lg shadow-md transition duration-300 transform hover:scale-105 ${
            !isRandomBgColor ? "bg-base-200 border" : ""
          }`}
        >
          Friends Chat
        </button>
      </div>

      {showFriendChat && (
        <aside className="h-full w-full mt-4">
          <input
            type="text"
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mt-3 p-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-400"
          />
          <div className="py-3">
            <h3 className="text-lg font-medium px-3 mb-2">Friends Chat</h3>
            {filteredUsers().map((user) => (
              <motion.button
                key={user._id}
                onClick={() => {setSelectedUser(user); setIsChatsActive(true);}}
                whileHover={{ scale: 1.05 }}
                className="w-full p-3 flex items-center gap-3 hover:bg-base-300 transition rounded-lg"
              >
                <div className="relative">
                  <img
                    src={user.profilePic || "/avatar.png"}
                    alt={user.name}
                    className="w-12 h-12 object-cover rounded-full border border-gray-300"
                  />
                  {onlineUsers.includes(user._id) && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white" />
                  )}
                </div>
                <div className=" text-left min-w-0">
                  <div className="font-medium truncate">{user.fullName}</div>
                  <div className="text-sm">
                    {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                  </div>
                </div>
              </motion.button>
            ))}
            {filteredUsers().length === 0 && (
              <div className="text-center py-4">No Friends found</div>
            )}
          </div>
        </aside>
      )}

      {showRandomChat && (
        <motion.div
          className="p-3 rounded-lg mt-4 shadow-md bg-base-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {selectedUser ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="relative mx-0">
                  <img
                    src={selectedUser.profilePic || "/avatar.png"}
                    alt={selectedUser.name}
                    className="w-12 h-12 object-cover rounded-full border border-gray-300"
                  />
                  {onlineUsers.includes(selectedUser._id) && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white" />
                  )}
                </div>
                <div className="text-left min-w-0">
                  <div className="font-medium truncate">{selectedUser.fullName}</div>
                  <div className="text-sm">
                    {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-medium">Random Chat</h3>
              <p className="text-sm">Start a conversation with a random person!</p>
              <button
                onClick={handleGetRandomUser}
                className="mt-3 px-4 py-2 rounded-lg shadow-md transition duration-300 transform hover:scale-105 bg-base-200 hover:bg-base-200"
              >
                Start New Chat
              </button>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Sidebar;