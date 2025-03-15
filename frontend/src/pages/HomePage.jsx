import { useChatStore } from "../store/useChatStore";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import { Contact } from "lucide-react";

const HomePage = () => {
  const { selectedUser, randomUser } = useChatStore();
  const [activeChartType, setActiveChartType] = useState("random");
  const [isChatsActive, setIsChatsActive] = useState(false);
  
  const handleTypeofChat = (type) => {
    setActiveChartType(type);
  }


  
  const chartVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
  };

  useEffect(() => {
    console.log(isChatsActive)
  }
  , [isChatsActive]);

  return (
    <div className="min-h-screen bg-base-200">
      <div className="pt-20 px-2">
        <div className="bg-base-100 rounded-lg shadow-cl w-full h-[calc(100vh-6rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            <Sidebar CurrentTypeOfChat={handleTypeofChat} isChatsActive={isChatsActive} setIsChatsActive ={setIsChatsActive}/>
            {(isChatsActive && selectedUser) ? (
              <ChatContainer isChatsActive={isChatsActive} setIsChatsActive ={setIsChatsActive} activeChartType={activeChartType}/>
            ) : (
              <NoChatSelected />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
