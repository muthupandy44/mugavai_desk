import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useShop } from "./ShopContext";
import type { Tables } from "@/integrations/supabase/types";

export type ServiceOrder = Tables<"services">;
export type SaleRecord = Tables<"sales">;

interface ShopDataContextType {
  services: ServiceOrder[];
  sales: SaleRecord[];
  loading: boolean;
  hasMoreServices: boolean;
  hasMoreSales: boolean;
  loadMoreServices: () => Promise<void>;
  loadMoreSales: () => Promise<void>;
  addService: (order: { customerName: string; phone: string; deviceModel: string; issue: string; estimatedCost: number; status: string; imeiNumber?: string; hsnCode?: string; taxableAmount?: number | null; gstAmount?: number | null; amountInWords?: string }) => Promise<ServiceOrder | null>;
  addSale: (sale: { customerName: string; phone: string; itemName: string; totalAmount: number; paymentMode: string; downpayment?: number; financeProvider?: string; financeBalance?: number }) => Promise<SaleRecord | null>;
  updateService: (id: string, updates: Record<string, unknown>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  updateSale: (id: string, updates: Record<string, unknown>) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const ShopDataContext = createContext<ShopDataContextType | null>(null);

export function ShopDataProvider({ children }: { children: ReactNode }) {
  const { shop } = useShop();
  const [services, setServices] = useState<ServiceOrder[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMoreServices, setHasMoreServices] = useState(true);
  const [hasMoreSales, setHasMoreSales] = useState(true);
  const [servicesOffset, setServicesOffset] = useState(0);
  const [salesOffset, setSalesOffset] = useState(0);

  const fetchData = useCallback(async (reset = false) => {
    if (!shop) { setServices([]); setSales([]); setLoading(false); return; }
    setLoading(true);
    
    const currentServicesOffset = reset ? 0 : servicesOffset;
    const currentSalesOffset = reset ? 0 : salesOffset;
    
    const limit = 20;
    
    const [srvRes, salRes] = await Promise.all([
      supabase.from("services").select("*").eq("shop_id", shop.id).order("created_at", { ascending: false }).limit(limit).range(currentServicesOffset, currentServicesOffset + limit - 1),
      supabase.from("sales").select("*").eq("shop_id", shop.id).order("created_at", { ascending: false }).limit(limit).range(currentSalesOffset, currentSalesOffset + limit - 1),
    ]);
    
    if (reset) {
      setServices(srvRes.data ?? []);
      setSales(salRes.data ?? []);
      setServicesOffset(limit);
      setSalesOffset(limit);
    } else {
      setServices((prev) => [...prev, ...(srvRes.data ?? [])]);
      setSales((prev) => [...prev, ...(salRes.data ?? [])]);
      setServicesOffset((prev) => prev + limit);
      setSalesOffset((prev) => prev + limit);
    }
    
    setHasMoreServices((srvRes.data?.length ?? 0) >= limit);
    setHasMoreSales((salRes.data?.length ?? 0) >= limit);
    setLoading(false);
  }, [shop, servicesOffset, salesOffset]);

  useEffect(() => { fetchData(true); }, [shop]);

  const loadMoreServices = useCallback(async () => {
    if (!hasMoreServices || loading) return;
    const limit = 20;
    const srvRes = await supabase.from("services").select("*").eq("shop_id", shop!.id).order("created_at", { ascending: false }).limit(limit).range(servicesOffset, servicesOffset + limit - 1);
    setServices((prev) => [...prev, ...(srvRes.data ?? [])]);
    setServicesOffset((prev) => prev + limit);
    setHasMoreServices((srvRes.data?.length ?? 0) >= limit);
  }, [hasMoreServices, loading, shop, servicesOffset]);

  const loadMoreSales = useCallback(async () => {
    if (!hasMoreSales || loading) return;
    const limit = 20;
    const salRes = await supabase.from("sales").select("*").eq("shop_id", shop!.id).order("created_at", { ascending: false }).limit(limit).range(salesOffset, salesOffset + limit - 1);
    setSales((prev) => [...prev, ...(salRes.data ?? [])]);
    setSalesOffset((prev) => prev + limit);
    setHasMoreSales((salRes.data?.length ?? 0) >= limit);
  }, [hasMoreSales, loading, shop, salesOffset]);

  const addService = useCallback(async (order: { customerName: string; phone: string; deviceModel: string; issue: string; estimatedCost: number; status: string; imeiNumber?: string; hsnCode?: string; taxableAmount?: number | null; gstAmount?: number | null; amountInWords?: string }) => {
    if (!shop) return null;
    const billId = `SRV-${Date.now().toString(36).toUpperCase()}`;
    const { data, error } = await supabase.from("services").insert({
      shop_id: shop.id,
      bill_id: billId,
      customer_name: order.customerName,
      phone: order.phone,
      device_model: order.deviceModel,
      issue: order.issue,
      estimated_cost: order.estimatedCost,
      status: order.status,
      imei_number: order.imeiNumber || null,
      hsn_code: order.hsnCode || null,
      taxable_amount: order.taxableAmount || null,
      gst_amount: order.gstAmount || null,
      amount_in_words: order.amountInWords || null,
    }).select().single();
    if (!error && data) setServices((prev) => [data, ...prev]);
    return data;
  }, [shop]);

  const addSale = useCallback(async (sale: { customerName: string; phone: string; itemName: string; totalAmount: number; paymentMode: string; downpayment?: number; financeProvider?: string; financeBalance?: number }) => {
    if (!shop) return null;
    const billId = `SAL-${Date.now().toString(36).toUpperCase()}`;
    const { data, error } = await supabase.from("sales").insert({
      shop_id: shop.id,
      bill_id: billId,
      customer_name: sale.customerName,
      phone: sale.phone,
      item_name: sale.itemName,
      total_amount: sale.totalAmount,
      payment_mode: sale.paymentMode,
      downpayment: sale.downpayment,
      finance_provider: sale.financeProvider,
      finance_balance: sale.financeBalance,
    }).select().single();
    if (!error && data) setSales((prev) => [data, ...prev]);
    return data;
  }, [shop]);

  const updateService = useCallback(async (id: string, updates: Record<string, unknown>) => {
    await supabase.from("services").update(updates).eq("id", id);
    setServices((prev) => prev.map((s) => s.id === id ? { ...s, ...updates } as ServiceOrder : s));
  }, []);

  const deleteService = useCallback(async (id: string) => {
    await supabase.from("services").delete().eq("id", id);
    setServices((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const updateSale = useCallback(async (id: string, updates: Record<string, unknown>) => {
    await supabase.from("sales").update(updates).eq("id", id);
    setSales((prev) => prev.map((s) => s.id === id ? { ...s, ...updates } as SaleRecord : s));
  }, []);

  const deleteSale = useCallback(async (id: string) => {
    await supabase.from("sales").delete().eq("id", id);
    setSales((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return (
    <ShopDataContext.Provider value={{ services, sales, loading, hasMoreServices, hasMoreSales, loadMoreServices, loadMoreSales, addService, addSale, updateService, deleteService, updateSale, deleteSale, refresh: () => fetchData(true) }}>
      {children}
    </ShopDataContext.Provider>
  );
}

export function useShopData() {
  const ctx = useContext(ShopDataContext);
  if (!ctx) throw new Error("useShopData must be used within ShopDataProvider");
  return ctx;
}
