import { useAuthStore } from "../store/useAuthStore";
import { Mail, User, Globe, Landmark, Info } from "lucide-react";

const ProfilePage = () => {
  const { authUser } = useAuthStore();

  const InfoItem = ({ icon: Icon, label, value }) => (
    <div className="space-y-1.5">
      <div className="text-sm text-zinc-400 flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{value || "-"}</p>
    </div>
  );

  return (
    <div className="pt-20">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Profile</h1>
          </div>

          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={authUser?.profilePic || "/avatar.png"}
                alt={`${authUser?.fullName || "User"}'s Profile`}
                className="size-32 rounded-full object-cover border-4"
              />
            </div>
          </div>

          <div className="space-y-6">
            {/* Name & Nickname */}
            <div className="grid grid-cols-2 gap-4">
              <InfoItem icon={User} label="Full Name" value={authUser?.fullName} />
              <InfoItem icon={User} label="Nickname" value={authUser?.nickname} />
            </div>

            {/* Bio Section */}
            <InfoItem icon={Info} label="Bio" value={authUser?.bio || "No bio available."} />

            {/* Country & City */}
            <div className="grid grid-cols-2 gap-4">
              <InfoItem icon={Globe} label="Country" value={authUser?.country} />
              <InfoItem icon={Landmark} label="City" value={authUser?.city} />
            </div>

            {/* Email Section */}
            <InfoItem icon={Mail} label="Email Address" value={authUser?.email} />
          </div>

          {/* Account Information Section */}
          <div className="mt-6 bg-base-300 rounded-xl p-6">
            <h2 className="text-lg font-medium mb-4">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span>Member Since</span>
                <span>{authUser?.createdAt?.split("T")[0] || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Account Status</span>
                <span className="text-green-500">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
