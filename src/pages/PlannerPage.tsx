import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarDays, MapPin, Wallet, Sparkles, Save, Share2, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const interestOptions = ["Culture", "Nature", "Food", "Adventure", "Shopping", "History", "Nightlife"];
const INR = "\u20B9";
const budgetOptions = [
  { label: "Low", range: `${INR}1,500 - ${INR}3,000/day` },
  { label: "Medium", range: `${INR}5,000 - ${INR}8,000/day` },
  { label: "Luxury", range: `${INR}15,000+/day` },
];

const PlannerPage = () => {
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState("Medium");
  const [selectedInterests, setSelectedInterests] = useState<string[]>(["Culture", "Food"]);
  const [itinerary, setItinerary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const { user } = useAuth();

  // Get user location for AI context
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  const toggleInterest = (i: string) => {
    setSelectedInterests((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );
  };

  const generatePlan = async () => {
    if (!destination) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-itinerary", {
        body: {
          destination,
          days,
          budget,
          interests: selectedInterests,
          latitude: userCoords?.lat,
          longitude: userCoords?.lng,
        },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        // Fallback to local generation
        setItinerary(generateFallbackItinerary(destination, days, budget, selectedInterests));
      } else if (data?.itinerary) {
        setItinerary(data.itinerary);
      } else {
        throw new Error("No itinerary returned");
      }
    } catch (err: any) {
      console.error("AI itinerary error:", err);
      toast.error("AI unavailable — using fallback itinerary");
      setItinerary(generateFallbackItinerary(destination, days, budget, selectedInterests));
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!itinerary || !user) {
      toast.error("Please sign in to save plans");
      return;
    }
    const { error } = await supabase.from("visited_plans").insert({
      user_id: user.id,
      destination,
      days,
      budget,
      itinerary,
      status: "planned",
    });
    if (error) toast.error("Failed to save plan");
    else toast.success("Plan saved!");
  };

  const handleMarkVisited = async () => {
    if (!itinerary || !user) {
      toast.error("Please sign in to save plans");
      return;
    }
    const { error } = await supabase.from("visited_plans").insert({
      user_id: user.id,
      destination,
      days,
      budget,
      itinerary,
      status: "visited",
    });
    if (error) toast.error("Failed to save");
    else toast.success("Marked as visited!");
  };

  const handleShare = async () => {
    if (itinerary && navigator.share) {
      await navigator.share({ title: `${destination} Trip Plan`, text: itinerary });
    }
  };

  return (
    <div className="px-4 pt-6 pb-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">AI Tour Planner</h1>
        <p className="text-sm text-muted-foreground mt-1">Generate your perfect itinerary with AI</p>
      </div>

      {!itinerary ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div>
            <label className="text-sm font-medium flex items-center gap-1.5 mb-2">
              <MapPin size={16} className="text-primary" /> Destination
            </label>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Enter city name..."
              className="w-full h-12 px-4 rounded-xl bg-card shadow-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="text-sm font-medium flex items-center gap-1.5 mb-2">
              <CalendarDays size={16} className="text-primary" /> Number of Days
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 5, 7].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    days === d
                      ? "bg-gradient-hero text-primary-foreground shadow-glow"
                      : "bg-card border border-border text-foreground"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium flex items-center gap-1.5 mb-2">
              <Wallet size={16} className="text-primary" /> Budget
            </label>
            <div className="flex gap-2">
              {budgetOptions.map((b) => (
                <button
                  key={b.label}
                  onClick={() => setBudget(b.label)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex flex-col items-center ${
                    budget === b.label
                      ? "bg-gradient-hero text-primary-foreground shadow-glow"
                      : "bg-card border border-border text-foreground"
                  }`}
                >
                  <span>{b.label}</span>
                  <span className="text-[10px] opacity-80">{b.range}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium flex items-center gap-1.5 mb-2">
              <Sparkles size={16} className="text-primary" /> Interests
            </label>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((i) => (
                <button
                  key={i}
                  onClick={() => toggleInterest(i)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedInterests.includes(i)
                      ? "bg-gradient-hero text-primary-foreground"
                      : "bg-card border border-border text-foreground"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generatePlan}
            disabled={!destination || loading}
            className="w-full h-14 rounded-2xl bg-gradient-hero text-primary-foreground font-semibold text-base shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
            {loading ? "AI is planning..." : "Generate Itinerary"}
          </button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-card rounded-2xl p-4 shadow-card border border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold font-display text-lg">
                {destination} — {days} Day{days > 1 ? "s" : ""}
              </h2>
              <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">{budget}</span>
            </div>
            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-line text-sm leading-relaxed">
              {itinerary}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleSave}
              className="h-12 rounded-xl bg-gradient-hero text-primary-foreground font-medium text-xs flex items-center justify-center gap-1.5"
            >
              <Save size={14} /> Save
            </button>
            <button
              onClick={handleMarkVisited}
              className="h-12 rounded-xl bg-gradient-forest text-primary-foreground font-medium text-xs flex items-center justify-center gap-1.5"
            >
              <CheckCircle size={14} /> Visited
            </button>
            <button
              onClick={handleShare}
              className="h-12 rounded-xl bg-card border border-border font-medium text-xs flex items-center justify-center gap-1.5"
            >
              <Share2 size={14} /> Share
            </button>
          </div>

          <button onClick={() => setItinerary(null)} className="w-full text-sm text-primary font-medium">
            ← Create new plan
          </button>
        </motion.div>
      )}
    </div>
  );
};

function generateFallbackItinerary(city: string, days: number, budget: string, interests: string[]) {
  const R = "\u20B9";
  const budgetMap: Record<string, string> = {
    Low: `${R}1,500 - ${R}3,000`,
    Medium: `${R}5,000 - ${R}8,000`,
    Luxury: `${R}15,000+`,
  };
  const lines: string[] = [];
  for (let d = 1; d <= days; d++) {
    lines.push(`📅 Day ${d}`);
    lines.push(`🌅 Morning: Visit the famous ${city} cultural district`);
    if (interests.includes("Food"))
      lines.push(`🍽️ Lunch: Try local ${budget === "Luxury" ? "fine dining" : "street food"} specialties`);
    lines.push(`🏛️ Afternoon: Explore historical landmarks and museums`);
    if (interests.includes("Nature")) lines.push(`🌿 Evening: Sunset walk at the scenic viewpoint`);
    if (interests.includes("Nightlife")) lines.push(`🌙 Night: Experience the local nightlife scene`);
    lines.push(`💰 Est. budget: ${budgetMap[budget] || `${R}5,000 - ${R}8,000`}`);
    lines.push("");
  }
  return lines.join("\n");
}

export default PlannerPage;
