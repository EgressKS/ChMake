import { X, UserPlus, Bell, History } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

const ChatHeader = ({ type, onShowHistory, setIsChatsActive }) => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers, sendFriendRequest } = useAuthStore();

  const setFriendRequestHandle = async (userId) => {
    try {
      await sendFriendRequest(userId);
      console.log("Friend request sent to", userId);
    } catch (error) {
      console.error("Failed to send friend request", error);
    }
  };

  return (
    <div className="w-full p-2.5 px-3 border-b border-base-300 overflow-x-hidden backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full">
              <img
                src={selectedUser.profilePic || "/avatar.png"}
                alt={selectedUser.fullName}
              />
            </div>
          </div>
          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>
        

        <div className="flex gap-3">
          {type === "random" && (
            <div className="flex items-center gap-4">
              <button onClick={() => setFriendRequestHandle(selectedUser._id)}>
                <UserPlus />
              </button>
              <button>
                <Bell />
              </button>
              <button onClick={onShowHistory}>
                <History />
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <button onClick={() => {setSelectedUser(null); setIsChatsActive(false)}}>
            <X />
          </button>

        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
