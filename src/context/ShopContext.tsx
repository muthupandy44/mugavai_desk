import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import type { Tables } from "@/integrations/supabase/types";

type Shop = Tables<"shops">;

interface ShopContextType {
  shop: Shop | null;
  loading: boolean;
  registerShop: (name: string, address: string) => Promise<{ error: string | null }>;
}

const ShopContext = createContext<ShopContextType | null>(null);

export function ShopProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setShop(null); setLoading(false); return; }

    const fetchOrCreateShop = async () => {
      setLoading(true);
      
      // First, try to fetch existing shop
      const { data: existingShop } = await supabase
        .from("shops")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();
      
      if (existingShop) {
        setShop(existingShop);
      } else {
        // Create a default shop if none exists
        const defaultShopName = `${user.email?.split('@')[0] || 'User'}'s Mobile Shop`;
        const { data: newShop, error } = await supabase
          .from("shops")
          .insert({ 
            name: defaultShopName, 
            address: "Default address - please update",
            owner_id: user.id 
          })
          .select()
          .single();
        
        if (!error && newShop) {
          setShop(newShop);
        } else if (error) {
          console.error('Failed to create default shop:', error.message);
        }
      }
      
      setLoading(false);
    };

    fetchOrCreateShop();
  }, [user]);

  const registerShop = useCallback(async (name: string, address: string) => {
    if (!user) return { error: "Not authenticated" };
    const { data, error } = await supabase
      .from("shops")
      .insert({ name, address, owner_id: user.id })
      .select()
      .single();
    if (error) return { error: error.message };
    setShop(data);
    return { error: null };
  }, [user]);

  return (
    <ShopContext.Provider value={{ shop, loading, registerShop }}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used within ShopProvider");
  return ctx;
}
