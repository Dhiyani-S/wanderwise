import { useState, useRef, useCallback } from "react";
import { Search, MapPin, QrCode, CalendarDays, Utensils, Bookmark, Star, ChevronRight, Loader2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { nearbyPlaces } from "@/lib/mock-data";
import { useSavedPlaces } from "@/hooks/useSavedPlaces";
import heroImage from "@/assets/hero-travel.jpg";
import WiseBot from "@/components/WiseBot";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
}

const quickActions = [
  { icon: MapPin, label: "Nearby", path: "/map", gradient: "bg-gradient-hero" },
  { icon: QrCode, label: "Scan QR", path: "/qr-scanner", gradient: "bg-gradient-ocean" },
  { icon: CalendarDays, label: "AI Planner", path: "/planner", gradient: "bg-gradient-forest" },
  { icon: Utensils, label: "Food", path: "/food", gradient: "bg-gradient-hero" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const HomePage = () => {
  const navigate = useNavigate();
  const { toggleSavePlace, isPlaceSaved } = useSavedPlaces();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchPlaces = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1`,
        { headers: { "User-Agent": "WanderWise/1.0" } }
      );
      const data: NominatimResult[] = await res.json();
      setSearchResults(data);
      setShowResults(true);
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchPlaces(value), 400);
  };

  const handleSelectResult = (result: NominatimResult) => {
    setShowResults(false);
    setSearchQuery(result.display_name);
    navigate(`/map?lat=${result.lat}&lng=${result.lon}&name=${encodeURIComponent(result.display_name)}`);
  };

  const attractions = nearbyPlaces.filter((p) =>
    ["attraction", "monument"].includes(p.category)
  );
  const foodPlaces = nearbyPlaces.filter((p) =>
    ["restaurant", "cafe"].includes(p.category)
  );

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Hero */}
      <motion.div variants={item} className="relative h-52 overflow-hidden">
        <img src={heroImage} alt="Explore the world" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h1 className="text-2xl font-bold font-display text-primary-foreground">WanderWise</h1>
          <p className="text-sm text-primary-foreground/80 mt-1">Explore smarter with AI.</p>
        </div>
      </motion.div>

      <div className="px-4 space-y-6">
        {/* Search */}
        <motion.div variants={item} className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              placeholder="Search destinations... e.g. Chennai Marina Beach"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              className="w-full h-12 pl-10 pr-10 rounded-xl bg-card shadow-card border border-border text-sm font-body placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {searching && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />}
            {searchQuery && !searching && (
              <button onClick={() => { setSearchQuery(""); setSearchResults([]); setShowResults(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <X size={16} />
              </button>
            )}
          </div>

          {showResults && searchResults.length > 0 && (
            <div className="absolute top-14 left-0 right-0 bg-card border border-border rounded-xl shadow-elevated z-50 overflow-hidden max-h-72 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.place_id}
                  onClick={() => handleSelectResult(result)}
                  className="w-full px-4 py-3 text-left hover:bg-muted/50 flex items-start gap-3 border-b border-border last:border-0"
                >
                  <MapPin size={16} className="text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm line-clamp-2">{result.display_name}</span>
                </button>
              ))}
            </div>
          )}
          {showResults && searchResults.length === 0 && searchQuery.length >= 3 && !searching && (
            <div className="absolute top-14 left-0 right-0 bg-card border border-border rounded-xl shadow-elevated z-50 p-4 text-center text-sm text-muted-foreground">
              No results found
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={item} className="grid grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-2"
            >
              <div className={`w-14 h-14 rounded-2xl ${action.gradient} flex items-center justify-center shadow-glow`}>
                <action.icon size={24} className="text-primary-foreground" />
              </div>
              <span className="text-xs font-medium text-foreground">{action.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Nearby Attractions */}
        <motion.section variants={item}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold font-display">Nearby Attractions</h2>
            <button onClick={() => navigate("/map")} className="text-xs text-primary font-medium flex items-center gap-0.5">
              See all <ChevronRight size={14} />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {attractions.map((place) => (
              <div key={place.id} className="min-w-[200px] bg-card rounded-2xl shadow-card overflow-hidden border border-border flex-shrink-0">
                <div className="relative h-28">
                  <img src={place.image} alt={place.name} className="w-full h-full object-cover" />
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSavePlace(place); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-card/80 backdrop-blur flex items-center justify-center"
                  >
                    <Bookmark size={14} className={isPlaceSaved(place.id) ? "fill-primary text-primary" : "text-foreground"} />
                  </button>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm font-display truncate">{place.name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Star size={12} className="fill-sunset text-sunset" /> {place.rating}
                    </span>
                    <span>{place.distance}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Food Places */}
        <motion.section variants={item}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold font-display">Food & Dining</h2>
            <button onClick={() => navigate("/food")} className="text-xs text-primary font-medium flex items-center gap-0.5">
              See all <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {foodPlaces.map((place) => (
              <div key={place.id} className="flex gap-3 bg-card rounded-2xl shadow-card p-3 border border-border">
                <img src={place.image} alt={place.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm font-display truncate">{place.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{place.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Star size={12} className="fill-sunset text-sunset" /> {place.rating}
                    </span>
                    <span>{place.distance}</span>
                    {place.priceRange && <span className="text-accent font-medium">{place.priceRange}</span>}
                  </div>
                </div>
                <button onClick={() => toggleSavePlace(place)} className="self-start mt-1">
                  <Bookmark size={16} className={isPlaceSaved(place.id) ? "fill-primary text-primary" : "text-muted-foreground"} />
                </button>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Travel Tips */}
        <motion.section variants={item} className="pb-4">
          <h2 className="text-lg font-bold font-display mb-3">Travel Tips</h2>
          <div className="bg-gradient-hero rounded-2xl p-4 shadow-glow">
            <p className="text-sm font-medium text-primary-foreground">💡 Pro Tip</p>
            <p className="text-xs text-primary-foreground/90 mt-1">
              Scan QR codes at monuments to get instant historical info, visiting hours, and audio guides — all free!
            </p>
          </div>
        </motion.section>
      </div>

      {/* Wise Bot */}
      <WiseBot />
    </motion.div>
  );
};

export default HomePage;
