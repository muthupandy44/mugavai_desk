import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { useShop } from "@/context/ShopContext";
import RegisterShop from "@/pages/RegisterShop";
import Auth from "@/pages/Auth";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const { shop, loading: shopLoading } = useShop();

  // Show loading spinner during auth check
  if (isLoading || (user && shopLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if no user (only after loading is complete)
  if (!user) return <Auth />;
  
  // Redirect to shop registration if no shop
  if (!shop) return <RegisterShop />;

  return <>{children}</>;
};

export default ProtectedRoute;
