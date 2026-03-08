import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ThankYou from "./pages/ThankYou";
import AdminLogin from "./pages/admin/Login";
import AdminLayout from "./components/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Companies from "./pages/admin/Companies";
import PartnerLogin from "./pages/partner/Login";
import PartnerLayout from "./components/PartnerLayout";
import PartnerLeads from "./pages/partner/Leads";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import { useInactivityLogout } from "./hooks/useInactivityLogout";

const queryClient = new QueryClient();

const AppContent = () => {
  useInactivityLogout();
  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/partner/login" element={<PartnerLogin />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="companies" element={<Companies />} />
          </Route>
          <Route path="/partner" element={<PartnerLayout />}>
            <Route path="leads" element={<PartnerLeads />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
