import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ShopProvider, useShop } from "./context/ShopContext";
import { ShopDataProvider } from "./context/ShopDataContext";
import AppLayout from "./components/AppLayout";
import Auth from "./pages/Auth";
import RegisterShop from "./pages/RegisterShop";
import Index from "./pages/Index";
import Service from "./pages/Service";
import Sales from "./pages/Sales";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppGate() {
  const { user, loading: authLoading } = useAuth();
  const { shop, loading: shopLoading } = useShop();

  if (authLoading || (user && shopLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Auth />;
  if (!shop) return <RegisterShop />;

  return (
    <ShopDataProvider>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/service" element={<Service />} />
          <Route path="/service/new" element={<Service />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/sales/new" element={<Sales />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </ShopDataProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ShopProvider>
            <AppGate />
          </ShopProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
