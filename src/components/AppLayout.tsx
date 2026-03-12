import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import BottomNav from "./BottomNav";
import { Loader2 } from "lucide-react";

const AppLayout = () => {
  const { user, isGuest, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!user && !isGuest) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      <main className="pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
