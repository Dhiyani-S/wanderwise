import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import HomePage from "@/pages/HomePage";
import MapPage from "@/pages/MapPage";
import PlannerPage from "@/pages/PlannerPage";
import TranslatorPage from "@/pages/TranslatorPage";
import ProfilePage from "@/pages/ProfilePage";
import FoodPage from "@/pages/FoodPage";
import QRScannerPage from "@/pages/QRScannerPage";
import AuthPage from "@/pages/AuthPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/planner" element={<PlannerPage />} />
              <Route path="/translator" element={<TranslatorPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/food" element={<FoodPage />} />
              <Route path="/qr-scanner" element={<QRScannerPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
