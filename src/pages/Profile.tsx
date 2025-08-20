import UserProfileManager from "@/components/UserProfileManager";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

const Profile = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gaming-dark">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <UserProfileManager />
        </div>
      </div>
    </div>
  );
};

export default Profile;