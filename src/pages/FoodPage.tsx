import { useState } from "react";
import { motion } from "framer-motion";
import { Star, MapPin, Clock, Navigation, Utensils } from "lucide-react";
import { nearbyPlaces, foodFilters } from "@/lib/mock-data";

const FoodPage = () => {
  const [activeFilter, setActiveFilter] = useState("All");

  const foodPlaces = nearbyPlaces.filter((p) =>
    ["restaurant", "cafe"].includes(p.category)
  );

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <div>
        <h1 className="text-2xl font-bold font-display">Food & Dining</h1>
        <p className="text-sm text-muted-foreground mt-1">Discover nearby restaurants & cafes</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {foodFilters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeFilter === f
                ? "bg-gradient-hero text-primary-foreground shadow-glow"
                : "bg-card border border-border text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Places */}
      <div className="space-y-3">
        {foodPlaces.map((place) => (
          <motion.div
            key={place.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl shadow-card border border-border overflow-hidden"
          >
            <img src={place.image} alt={place.name} className="w-full h-36 object-cover" />
            <div className="p-4">
              <div className="flex items-start justify-between">
                <h3 className="font-bold font-display">{place.name}</h3>
                {place.priceRange && (
                  <span className="text-xs font-medium text-forest bg-accent/20 px-2 py-0.5 rounded-full">
                    {place.priceRange}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{place.description}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <Star size={12} className="fill-sunset text-sunset" /> {place.rating}
                </span>
                <span className="flex items-center gap-0.5">
                  <MapPin size={12} /> {place.distance}
                </span>
                {place.hours && (
                  <span className="flex items-center gap-0.5">
                    <Clock size={12} /> {place.hours}
                  </span>
                )}
              </div>
              <a
                href={`https://www.openstreetmap.org/directions?from=&to=${place.lat}%2C${place.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 w-full h-10 rounded-xl bg-gradient-hero text-primary-foreground font-medium text-sm flex items-center justify-center gap-1.5"
              >
                <Navigation size={14} /> Get Directions
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FoodPage;
