import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Image, Send, X, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

const MessageInput = ({ type }) => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const fileInputRef = useRef(null);
  const { sendMessage, getRandomUser, selectedUser } = useChatStore();
  const { isDisconnected, resetDisconnectionStatus, disconnectSocket, connectSocket, addChatHistory } = useAuthStore();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });

      // Clear form
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleGetRandomUser = async () => {
    setShowConfirm(false);
    resetDisconnectionStatus();
    const randomUser = await getRandomUser();
    connectSocket();
    if (randomUser) {
      await addChatHistory(randomUser._id);
    }
  };

  const handleSkip = () => {
    setShowConfirm(true);
  };

  const confirmSkip = () => {
    setShowConfirm(false);
    disconnectSocket();
  };

  return (
    <div className="p-4 w-full">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        {type === "random" && (
          <>
            <button
              onClick={handleGetRandomUser}
              className={` px-4 py-2 rounded-lg  transition ${!isDisconnected ? "cursor-not-allowed bg-gray-600" : "bg-blue-500 text-white hover:bg-blue-600"}`}
              disabled={!isDisconnected}
            >
              New Chat
            </button>
            <button
              onClick={handleSkip}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
              disabled={isDisconnected}
            >
              Skip
            </button>
            {showConfirm && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-16 transform -translate-x-1/2 bg-white dark:bg-gray-800 shadow-md p-4 rounded-lg flex items-center gap-3"
              >
                <p className="text-sm font-medium">Are you sure?</p>
                <button onClick={confirmSkip} className="bg-green-500 text-white px-3 py-1 rounded-lg">Yes</button>
                <button onClick={() => setShowConfirm(false)} className="bg-gray-500 text-white px-3 py-1 rounded-lg">No</button>
                <XCircle onClick={() => setShowConfirm(false)} className="size-5 cursor-pointer text-gray-500 hover:text-red-500 transition" />
              </motion.div>
            )}
          </>
        )}
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 flex-1">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              className={`w-full input input-bordered rounded-lg input-sm sm:input-md ${isDisconnected ? "cursor-not-allowed" : ""}`}
              placeholder="Type a message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isDisconnected}
            />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageChange}
              disabled={isDisconnected}
            />
            <button
              type="button"
              className={`hidden sm:flex btn btn-circle ${isDisconnected ? "cursor-not-allowed" : ""} ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
              onClick={() => fileInputRef.current?.click()}
              disabled={isDisconnected}
            >
              <Image size={20} />
            </button>
          </div>
          <button
            type="submit"
            className={`btn btn-sm btn-circle ${isDisconnected ? "cursor-not-allowed" : ""}`}
            disabled={!text.trim() && !imagePreview || isDisconnected}
          >
            <Send size={22} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default MessageInput;