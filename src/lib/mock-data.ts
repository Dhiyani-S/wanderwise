export interface Place {
  id: string;
  name: string;
  description: string;
  category: "attraction" | "restaurant" | "hotel" | "cafe" | "monument";
  rating: number;
  distance: string;
  image: string;
  lat: number;
  lng: number;
  priceRange?: string;
  hours?: string;
}

export const nearbyPlaces: Place[] = [
  {
    id: "1",
    name: "Gateway of India",
    description: "Iconic arch monument built during the British Raj overlooking the Arabian Sea.",
    category: "monument",
    rating: 4.6,
    distance: "1.2 km",
    image: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400&h=300&fit=crop",
    lat: 18.9220,
    lng: 72.8347,
  },
  {
    id: "2",
    name: "Taj Mahal Palace",
    description: "Legendary five-star hotel with stunning Indo-Saracenic architecture.",
    category: "hotel",
    rating: 4.8,
    distance: "1.3 km",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop",
    lat: 18.9217,
    lng: 72.8332,
    priceRange: "\u20B9\u20B9\u20B9",
  },
  {
    id: "3",
    name: "Leopold Cafe",
    description: "Famous cafe and bar featured in the bestseller Shantaram.",
    category: "cafe",
    rating: 4.2,
    distance: "0.8 km",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop",
    lat: 18.9228,
    lng: 72.8317,
    priceRange: "\u20B9\u20B9",
    hours: "8 AM - 12 AM",
  },
  {
    id: "4",
    name: "Elephanta Caves",
    description: "UNESCO World Heritage rock-cut cave temples dedicated to Lord Shiva.",
    category: "attraction",
    rating: 4.4,
    distance: "10 km",
    image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&h=300&fit=crop",
    lat: 18.9633,
    lng: 72.9315,
  },
  {
    id: "5",
    name: "Street Food Corner",
    description: "Authentic local street food with vada pav, pav bhaji, and more.",
    category: "restaurant",
    rating: 4.5,
    distance: "0.3 km",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop",
    lat: 18.9250,
    lng: 72.8330,
    priceRange: "\u20B9",
    hours: "10 AM - 11 PM",
  },
  {
    id: "6",
    name: "Marine Drive",
    description: "Scenic boulevard along the coast, known as the Queen's Necklace.",
    category: "attraction",
    rating: 4.7,
    distance: "2.1 km",
    image: "https://images.unsplash.com/photo-1567157577867-05ccb1388e13?w=400&h=300&fit=crop",
    lat: 18.9432,
    lng: 72.8235,
  },
];

export const foodFilters = [
  "All",
  "Street Food",
  "Vegetarian",
  "Local Cuisine",
  "Budget Friendly",
  "Fine Dining",
];

export const languages = [
  { code: "en", name: "English", flag: "\uD83C\uDDEC\uD83C\uDDE7" },
  { code: "hi", name: "Hindi", flag: "\uD83C\uDDEE\uD83C\uDDF3" },
  { code: "ta", name: "Tamil", flag: "\uD83C\uDDEE\uD83C\uDDF3" },
  { code: "es", name: "Spanish", flag: "\uD83C\uDDEA\uD83C\uDDF8" },
  { code: "fr", name: "French", flag: "\uD83C\uDDEB\uD83C\uDDF7" },
  { code: "de", name: "German", flag: "\uD83C\uDDE9\uD83C\uDDEA" },
  { code: "zh", name: "Chinese", flag: "\uD83C\uDDE8\uD83C\uDDF3" },
  { code: "ja", name: "Japanese", flag: "\uD83C\uDDEF\uD83C\uDDF5" },
  { code: "ar", name: "Arabic", flag: "\uD83C\uDDF8\uD83C\uDDE6" },
];
