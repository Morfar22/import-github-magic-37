import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ServerSettingsProvider } from "@/hooks/useServerSettings";
import { GlobalPresenceProvider } from "@/contexts/GlobalPresenceContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import StaffProtectedRoute from "@/components/StaffProtectedRoute";
import MaintenanceMode from "@/components/MaintenanceMode";
import ApplicationGate from "@/components/ApplicationGate";
import PrivacyNotice from "@/components/PrivacyNotice";
import Footer from "@/components/Footer";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Apply from "./pages/Apply";
import ApplicationForm from "./pages/ApplicationForm";
import Rules from "./pages/Rules";
import Laws from "./pages/Laws";
import StaffPanel from "./pages/StaffPanel";
import OurTeam from "./pages/OurTeam";
import Partners from "./pages/Partners";
import ServerManagement from "./pages/ServerManagement";
import Profile from "./pages/Profile";
import Live from "./pages/Live";
import Packages from "./pages/Packages";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  return (
    <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <MaintenanceMode />
            <PrivacyNotice />
            <div className="min-h-screen flex flex-col">
              <div className="flex-1">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/rules" element={<Rules />} />
                  <Route path="/laws" element={<Laws />} />
                  <Route path="/apply" element={
                    <ProtectedRoute>
                      <ApplicationGate>
                        <Apply />
                      </ApplicationGate>
                    </ProtectedRoute>
                  } />
                  <Route path="/application-form" element={
                    <ProtectedRoute>
                      <ApplicationForm />
                    </ProtectedRoute>
                  } />
                  <Route path="/staff" element={
                    <StaffProtectedRoute>
                      <StaffPanel />
                    </StaffProtectedRoute>
                  } />
                  <Route path="/servers" element={
                    <StaffProtectedRoute>
                      <ServerManagement />
                    </StaffProtectedRoute>
                  } />
                  <Route path="/team" element={<OurTeam />} />
                  <Route path="/partners" element={<Partners />} />
                  <Route path="/packages" element={<Packages />} />
                  <Route path="/live" element={<Live />} />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
              <Footer />
            </div>
          </BrowserRouter>
    </TooltipProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ServerSettingsProvider>
        <GlobalPresenceProvider>
          <AppContent />
        </GlobalPresenceProvider>
      </ServerSettingsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
