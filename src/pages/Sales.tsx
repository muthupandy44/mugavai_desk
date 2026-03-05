import { useState, useEffect, useMemo } from "react";
import { Plus, Search, ShoppingCart, CreditCard, Trash2, Pencil, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import SalesForm from "@/components/SalesForm";
import { useShopData } from "@/context";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ThermalReceipt from "@/components/ThermalReceipt";
import { generateWhatsAppLink, generateSalesBillMessage } from "@/lib/billing";
import { useSearchParams } from "react-router-dom";

// Helper function to group by date
const groupByDate = (items: any[]) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const groups: Record<string, any[]> = {
    Today: [],
    Yesterday: [],
    "Last Week": [],
    Older: [],
  };

  items.forEach((item) => {
    const itemDate = new Date(item.created_at);
    if (itemDate.toDateString() === today.toDateString()) {
      groups.Today.push(item);
    } else if (itemDate.toDateString() === yesterday.toDateString()) {
      groups.Yesterday.push(item);
    } else if (itemDate >= lastWeek) {
      groups["Last Week"].push(item);
    } else {
      groups.Older.push(item);
    }
  });

  return groups;
};

const Sales = () => {
  const { sales, deleteSale, loading, hasMoreSales, loadMoreSales } = useShopData();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [editSale, setEditSale] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewReceipt, setViewReceipt] = useState<string | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  // Check for URL parameters to view specific sale
  useEffect(() => {
    const viewId = searchParams.get('view');
    if (viewId && sales.length > 0) {
      const sale = sales.find(s => s.id === viewId);
      if (sale) {
        setViewReceipt(viewId);
      }
    }
  }, [searchParams, sales]);

  // Enhanced search across multiple fields
  const filteredSales = useMemo(() => {
    let filtered = sales;

    // Apply payment filter
    if (paymentFilter !== "all") {
      filtered = filtered.filter(s => s.payment_mode === paymentFilter);
    }

    // Apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((s) => 
        s.item_name.toLowerCase().includes(searchLower) ||
        s.customer_name.toLowerCase().includes(searchLower) ||
        s.phone.includes(searchLower)
      );
    }

    return filtered;
  }, [sales, paymentFilter, search]);

  // Group filtered sales by date
  const groupedSales = useMemo(() => {
    return groupByDate(filteredSales);
  }, [filteredSales]);

  if (showForm) return <SalesForm onClose={() => { setShowForm(false); setEditSale(null); }} editSale={editSale} />;

  const receiptSale = viewReceipt ? sales.find((s) => s.id === viewReceipt) : null;

  const handleEdit = (saleId: string) => {
    setEditSale(saleId);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteSale(deleteId);
    setDeleteId(null);
    toast({ title: "Sale deleted" });
  };

  if (receiptSale) {
    const waLink = generateWhatsAppLink(receiptSale.phone, generateSalesBillMessage({
      id: receiptSale.bill_id, customerName: receiptSale.customer_name, itemName: receiptSale.item_name,
      totalAmount: receiptSale.total_amount, paymentMode: receiptSale.payment_mode,
      downpayment: receiptSale.downpayment ?? undefined, financeProvider: receiptSale.finance_provider ?? undefined,
    }));
    return (
      <div className="px-4 pt-6 space-y-6 animate-fade-in pb-6">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => setViewReceipt(null)} className="touch-target flex items-center justify-center">←</button>
          <h1 className="text-xl font-bold">Receipt — {receiptSale.bill_id}</h1>
        </div>
        <div className="overflow-auto rounded-2xl border border-border shadow-lg">
          <ThermalReceipt type="sale" id={receiptSale.bill_id} customerName={receiptSale.customer_name} phone={receiptSale.phone}
            date={new Date(receiptSale.created_at).toLocaleDateString("en-IN")} itemName={receiptSale.item_name}
            totalAmount={receiptSale.total_amount} paymentMode={receiptSale.payment_mode as "cash" | "emi"}
            downpayment={receiptSale.downpayment ?? undefined} financeProvider={receiptSale.finance_provider ?? undefined}
            financeBalance={receiptSale.finance_balance ?? undefined} />
        </div>
        <div className="space-y-3">
          <Button className="w-full h-14 rounded-xl bg-success hover:bg-success/90 text-success-foreground font-bold text-base" onClick={() => window.open(waLink, "_blank")}>
            📱 Share on WhatsApp
          </Button>
          <Button variant="outline" className="w-full h-14 rounded-xl font-semibold text-base" onClick={() => setViewReceipt(null)}>Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">Sales</h1>
        <Button className="h-14 px-5 rounded-xl font-bold text-base" onClick={() => { setShowForm(true); setEditSale(null); }}>
          <Plus className="h-5 w-5 mr-1" /> New Sale
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input 
          placeholder="Search by name, phone, or item..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="input-lg pl-12" 
        />
      </div>

      {/* Quick Filter Chips */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Payment:</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "cash", "emi"].map((payment) => (
            <button
              key={payment}
              onClick={() => setPaymentFilter(payment)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                paymentFilter === payment
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-muted"
              }`}
            >
              {payment === "all" && "All"}
              {payment === "cash" && "💵 Cash"}
              {payment === "emi" && "💳 EMI"}
            </button>
          ))}
        </div>
      </div>

      {loading && sales.length === 0 && (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Grouped Sales by Date */}
      <div className="space-y-6">
        {Object.entries(groupedSales).map(([dateGroup, items]) => {
          if (items.length === 0) return null;
          
          return (
            <div key={dateGroup} className="space-y-3">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                {dateGroup} ({items.length})
              </h3>
              <div className="space-y-2">
                {items.map((sale) => (
                  <div key={sale.id} className="glass-card p-4 flex items-center justify-between animate-fade-in">
                    <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => setViewReceipt(sale.id)}>
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${sale.payment_mode === "emi" ? "bg-primary/10" : "bg-success/10"}`}>
                        {sale.payment_mode === "emi" ? <CreditCard className="h-5 w-5 text-primary" /> : <ShoppingCart className="h-5 w-5 text-success" />}
                      </div>
                      <div>
                        <p className="text-base font-bold">{sale.item_name}</p>
                        <p className="text-sm text-muted-foreground">{sale.customer_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-base font-bold">₹{sale.total_amount.toLocaleString("en-IN")}</p>
                        <p className="text-xs font-semibold text-muted-foreground">{sale.payment_mode.toUpperCase()}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(sale.id); }}
                        className="p-1.5 rounded-lg hover:bg-muted/10 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteId(sale.id); }} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More Button */}
      {hasMoreSales && !loading && (
        <Button 
          variant="outline" 
          className="w-full h-14 rounded-xl font-semibold text-base" 
          onClick={loadMoreSales}
          disabled={loading}
        >
          {loading ? "Loading..." : "Load More Sales"}
        </Button>
      )}

      {!loading && filteredSales.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-12">
          {search || paymentFilter !== "all" ? "No sales match your filters" : "No sales found"}
        </p>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this sale?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The sale record will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Sales;
