import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, User, Mail, Globe, MapPin, Edit, XCircle, CheckCircle } from "lucide-react";

const SettingsPage = () => {
  const { authUser, updateProfile } = useAuthStore();
  const [formData, setFormData] = useState({
    fullName: authUser?.fullName || "",
    nickname: authUser?.nickname || "",
    bio: authUser?.bio || "",
    country: authUser?.country || "",
    city: authUser?.city || "",
    profilePic: authUser?.profilePic || "",
  });
  const [profilePicFile, setProfilePicFile] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setProfilePicFile(e.target.files[0]);
    setFormData({ ...formData, profilePic: URL.createObjectURL(e.target.files[0]) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    formDataToSend.append("nickname", formData.nickname);
    formDataToSend.append("bio", formData.bio);
    formDataToSend.append("country", formData.country);
    formDataToSend.append("city", formData.city);
    if (profilePicFile) {
      formDataToSend.append("profilePic", profilePicFile);
    }
    await updateProfile(formDataToSend);
  };

  return (
    <div className="h-screen pt-20">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-8">
          <h1 className="text-2xl font-semibold text-center">Settings</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <img
                  src={formData.profilePic || "/avatar.png"}
                  alt="Profile"
                  className="size-32 rounded-full object-cover border-4"
                />
                <label htmlFor="profilePicUpload" className="absolute bottom-0 right-0 bg-white p-1 rounded-full cursor-pointer shadow-md">
                  <Camera className="w-6 h-6 text-gray-600" />
                </label>
                <input
                  type="file"
                  id="profilePicUpload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {/* Name and Nickname */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-zinc-400 flex items-center gap-2">
                  <User className="w-4 h-4" /> Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-base-200 rounded-lg border"
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400 flex items-center gap-2">
                  <Edit className="w-4 h-4" /> Nickname
                </label>
                <input
                  type="text"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-base-200 rounded-lg border"
                />
              </div>
            </div>
            
            {/* Bio */}
            <div>
              <label className="text-sm text-zinc-400 flex items-center gap-2">
                <Edit className="w-4 h-4" /> Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-base-200 rounded-lg border resize-none"
              />
            </div>
            
            {/* Country and City */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-zinc-400 flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-base-200 rounded-lg border"
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-base-200 rounded-lg border"
                />
              </div>
            </div>

            {/* Email (Read-Only) */}
            <div>
              <label className="text-sm text-zinc-400 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email Address
              </label>
              <p className="px-4 py-2 bg-base-200 rounded-lg border cursor-not-allowed">
                {authUser?.email}
              </p>
            </div>
            
            {/* Buttons */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition"
              >
                <XCircle className="w-5 h-5 inline-block mr-2" /> Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition"
              >
                <CheckCircle className="w-5 h-5 inline-block mr-2" /> Update
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
