import { motion } from "framer-motion";
import { Bookmark, CalendarDays, Moon, Sun, Phone, Trash2, MapPin, LogOut, CheckCircle, Clock } from "lucide-react";
import { useSavedPlaces } from "@/hooks/useSavedPlaces";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface VisitedPlan {
  id: string;
  destination: string;
  days: number;
  budget: string;
  itinerary: string;
  status: string;
  created_at: string;
}

const ProfilePage = () => {
  const { savedPlaces, toggleSavePlace } = useSavedPlaces();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() =>
    document.documentElement.classList.contains("dark")
  );
  const [activeTab, setActiveTab] = useState<"places" | "planned" | "visited">("visited");
  const [visitedPlans, setVisitedPlans] = useState<VisitedPlan[]>([]);
  const [plannedPlans, setPlannedPlans] = useState<VisitedPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (!user) return;
    fetchPlans();
  }, [user]);

  const fetchPlans = async () => {
    if (!user) return;
    setLoadingPlans(true);
    const { data } = await supabase
      .from("visited_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      setVisitedPlans(data.filter((p) => p.status === "visited"));
      setPlannedPlans(data.filter((p) => p.status === "planned"));
    }
    setLoadingPlans(false);
  };

  const deletePlan = async (id: string) => {
    await supabase.from("visited_plans").delete().eq("id", id);
    fetchPlans();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (!user) {
    return (
      <div className="px-4 pt-6 pb-4 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <MapPin size={48} className="text-muted-foreground/30" />
        <p className="text-muted-foreground text-sm">Sign in to see your profile</p>
        <button
          onClick={() => navigate("/auth")}
          className="px-6 py-3 rounded-xl bg-gradient-hero text-primary-foreground font-medium shadow-glow"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Profile</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-card"
          >
            {darkMode ? <Sun size={18} className="text-sunset" /> : <Moon size={18} />}
          </button>
          <button
            onClick={handleSignOut}
            className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-card"
          >
            <LogOut size={18} className="text-destructive" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-2xl p-3 shadow-card border border-border text-center">
          <p className="text-xl font-bold font-display text-primary">{visitedPlans.length}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Visited</p>
        </div>
        <div className="bg-card rounded-2xl p-3 shadow-card border border-border text-center">
          <p className="text-xl font-bold font-display text-primary">{plannedPlans.length}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Planned</p>
        </div>
        <div className="bg-card rounded-2xl p-3 shadow-card border border-border text-center">
          <p className="text-xl font-bold font-display text-primary">{savedPlaces.length}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Saved</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([
          { key: "visited", icon: CheckCircle, label: "Visited" },
          { key: "planned", icon: Clock, label: "Planned" },
          { key: "places", icon: Bookmark, label: "Saved" },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1 ${
              activeTab === tab.key
                ? "bg-gradient-hero text-primary-foreground shadow-glow"
                : "bg-card border border-border"
            }`}
          >
            <tab.icon size={12} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        {activeTab === "places" ? (
          savedPlaces.length === 0 ? (
            <EmptyState icon={Bookmark} text="No saved places yet" sub="Bookmark places from the home screen" />
          ) : (
            savedPlaces.map((place) => (
              <div key={place.id} className="flex gap-3 bg-card rounded-2xl p-3 shadow-card border border-border">
                <img src={place.image} alt={place.name} className="w-16 h-16 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm font-display truncate">{place.name}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin size={10} /> {place.distance}
                  </p>
                </div>
                <button onClick={() => toggleSavePlace(place)} className="self-center">
                  <Trash2 size={16} className="text-destructive" />
                </button>
              </div>
            ))
          )
        ) : (
          renderPlanList(
            activeTab === "visited" ? visitedPlans : plannedPlans,
            activeTab,
            deletePlan,
            loadingPlans
          )
        )}
      </motion.div>

      {/* Emergency Contacts */}
      <div className="bg-card rounded-2xl p-4 shadow-card border border-border">
        <h3 className="font-semibold font-display flex items-center gap-2 mb-3">
          <Phone size={16} className="text-destructive" /> Emergency Contacts
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Police</span>
            <a href="tel:100" className="text-primary font-medium">100</a>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ambulance</span>
            <a href="tel:108" className="text-primary font-medium">108</a>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tourist Helpline</span>
            <a href="tel:1363" className="text-primary font-medium">1363</a>
          </div>
        </div>
      </div>
    </div>
  );
};

function EmptyState({ icon: Icon, text, sub }: { icon: any; text: string; sub: string }) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Icon size={40} className="mx-auto mb-3 opacity-30" />
      <p className="text-sm">{text}</p>
      <p className="text-xs mt-1">{sub}</p>
    </div>
  );
}

function renderPlanList(
  plans: VisitedPlan[],
  type: string,
  onDelete: (id: string) => void,
  loading: boolean
) {
  if (loading) {
    return <p className="text-center text-sm text-muted-foreground py-8">Loading...</p>;
  }
  if (plans.length === 0) {
    return (
      <EmptyState
        icon={type === "visited" ? CheckCircle : Clock}
        text={`No ${type} plans yet`}
        sub={type === "visited" ? "Mark plans as visited in the Planner" : "Save plans from the Planner"}
      />
    );
  }
  return plans.map((plan) => (
    <div key={plan.id} className="bg-card rounded-2xl p-4 shadow-card border border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {plan.status === "visited" ? (
            <CheckCircle size={16} className="text-accent" />
          ) : (
            <Clock size={16} className="text-primary" />
          )}
          <h3 className="font-semibold font-display">{plan.destination}</h3>
        </div>
        <button onClick={() => onDelete(plan.id)}>
          <Trash2 size={14} className="text-destructive" />
        </button>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {plan.days} days · {plan.budget} budget · {new Date(plan.created_at).toLocaleDateString()}
      </p>
    </div>
  ));
}

export default ProfilePage;
