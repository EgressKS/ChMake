import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = ({ activeChartType, isChatsActive, setIsChatsActive }) => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    users,
  } = useChatStore();

  const { authUser, isDisconnected, resetDisconnectionStatus, fetchChatHistory } = useAuthStore();
  const messageEndRef = useRef(null);

  const [chatHistory, setChatHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isClickShowHistory, setIsClickShowHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredHistory, setFilteredHistory] = useState([]);

  useEffect(() => {
    getMessages(selectedUser._id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    resetDisconnectionStatus();
  }, [selectedUser, resetDisconnectionStatus]);
  
  const handleShowChatHistory = async () => {
    try {
      setLoadingHistory(true);
      const history = await fetchChatHistory();
      setChatHistory(history);
      setFilteredHistory(history);
      setIsClickShowHistory(true);
    } catch (error) {
      console.error("Failed to fetch chat history", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCloseHistory = () => {
    setIsClickShowHistory(false);
  };

  useEffect(() => {
    setFilteredHistory(
      chatHistory.filter((user) =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, chatHistory]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className={`${isChatsActive ? "flex" : "hidden" } h-full md:flex flex-1 flex-col justify-between overflow-auto`}>
      <ChatHeader type={activeChartType} onShowHistory={handleShowChatHistory} setIsChatsActive={setIsChatsActive} />
      

      <div className=" flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
            ref={messageEndRef}
          >
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>
            <div className="chat-bubble flex flex-col">
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}
              {message.text && <p>{message.text}</p>}
            </div>
          </div>
        ))}
      </div>

      {isDisconnected && activeChartType === "random" && (
        <div className="p-4 text-center text-red-500">
          You are disconnected. Try to find new friends.
        </div>
      )}

      <MessageInput type={activeChartType} />

      {isClickShowHistory && (
        <div className="fixed top-21 right-2.5 w-80 h-[87%] bg-base-200 border-l rounded-md shadow-lg transition-transform duration-100 transform overflow-x-hidden z-50">
          <div className="p-4 border-b flex justify-between items-center">
            <h4 className="text-lg font-semibold">Chat History</h4>
            <button onClick={handleCloseHistory}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4">
            {/* Search Input */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search chat history..."
                className="w-full p-2 border rounded focus:outline-none focus:ring"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-150px)]">
              {loadingHistory ? (
                <div className="flex justify-center items-center h-full">
                  <span>Loading...</span>
                </div>
              ) : filteredHistory.length > 0 ? (
                filteredHistory.map((user) => (
                  <div key={user._id} className="flex items-center gap-3 py-2 border-b">
                    <div className="avatar">
                      <div className="size-10 rounded-full">
                        <img src={user.profilePic || "/avatar.png"} alt={user.fullName} />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium">{user.fullName}</h3>
                      <p className="text-base-content/70">
                        {users.includes(user._id) ? "Online" : "Offline"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center pt-5 text-base-content/70">
                  Chat history not present, please chat with a friend.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
