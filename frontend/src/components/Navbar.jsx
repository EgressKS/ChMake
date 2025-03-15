import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, MessageSquare, Settings, User, Sun, Moon } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const [isRightNavOpen, setIsRightNavOpen] = useState(false);
  const rightNavRef = useRef(null);
  const navigate = useNavigate();

  const toggleRightNav = () => {
    setIsRightNavOpen(!isRightNavOpen);
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (rightNavRef.current && !rightNavRef.current.contains(event.target)) {
        setIsRightNavOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [rightNavRef]);

  return (
    <>
      <header
        className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 
    backdrop-blur-lg bg-base-100/80"
      >
        <div className="container mx-auto px-4 h-16">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all">
                <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <h1 className="text-lg font-bold">ChMaKe</h1>
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <Link
                to={"/mode"}
                className={`
              btn btn-sm gap-2 transition-colors
              
              `}
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Mode</span>
              </Link>
              {authUser && (
                <>
                  <button onClick={toggleRightNav} className="flex gap-2 items-center">
                  <img src={authUser.profilePic || "/avatar.png"} alt="Profile" className="w-8 h-8 rounded-full" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {isRightNavOpen && (
        <div ref={rightNavRef} className=" fixed right-0 top-0 h-auto w-72 shadow-lg z-50 bg-base-100 dark:bg-base-200 border-l border-base-300">
          <button onClick={toggleRightNav} className="absolute top-4 right-4 text-2xl">
            &times;
          </button>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <img src={authUser.profilePic || "/avatar.png"} alt="Profile" className="w-8 h-8 rounded-full" />
              <span className="text-sm font-semibold">{authUser?.fullName}</span>
            </div>
            <hr className=" border-b-1 border-black mb-4"/>
            <nav className="flex flex-col gap-3 items-start">
              <Link to="/profile" className="flex items-center hover:bg-base-100 p-1 px-3 rounded w-full gap-2 transition-colors">
                <User className="w-4 h-4" />
                <span className="truncate">Profile</span>
              </Link>
              <Link to="/settings" className="flex items-center hover:bg-base-100 p-1 px-3 rounded w-full gap-2 transition-colors">
                <Settings className="w-4 h-4" />
                <span className="truncate">Settings</span>
              </Link>
              <Link to="/friends" className="flex items-center hover:bg-base-100 p-1 px-3 rounded w-full gap-2 transition-colors">
                <User className="w-4 h-4" />
                <span className="truncate">Friends</span>
              </Link>
              <button onClick={handleLogout} className="flex items-center hover:bg-base-100 p-1 px-3 rounded w-full gap-2 transition-colors">
                <LogOut className="w-4 h-4" />
                <span className="truncate">Logout</span>
              </button>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
