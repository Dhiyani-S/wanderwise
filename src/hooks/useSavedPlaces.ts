import { useState, useEffect } from "react";
import type { Place } from "@/lib/mock-data";

interface SavedPlan {
  id: string;
  destination: string;
  days: number;
  budget: string;
  itinerary: string;
  createdAt: string;
}

export function useSavedPlaces() {
  const [savedPlaces, setSavedPlaces] = useState<Place[]>(() => {
    const stored = localStorage.getItem("smarttour-saved-places");
    return stored ? JSON.parse(stored) : [];
  });

  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>(() => {
    const stored = localStorage.getItem("smarttour-saved-plans");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem("smarttour-saved-places", JSON.stringify(savedPlaces));
  }, [savedPlaces]);

  useEffect(() => {
    localStorage.setItem("smarttour-saved-plans", JSON.stringify(savedPlans));
  }, [savedPlans]);

  const toggleSavePlace = (place: Place) => {
    setSavedPlaces((prev) => {
      const exists = prev.find((p) => p.id === place.id);
      if (exists) return prev.filter((p) => p.id !== place.id);
      return [...prev, place];
    });
  };

  const isPlaceSaved = (id: string) => savedPlaces.some((p) => p.id === id);

  const savePlan = (plan: Omit<SavedPlan, "id" | "createdAt">) => {
    const newPlan: SavedPlan = {
      ...plan,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setSavedPlans((prev) => [...prev, newPlan]);
  };

  const removePlan = (id: string) => {
    setSavedPlans((prev) => prev.filter((p) => p.id !== id));
  };

  return { savedPlaces, savedPlans, toggleSavePlace, isPlaceSaved, savePlan, removePlan };
}
