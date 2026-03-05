import { IndianRupee, Wrench, Landmark, LogOut } from "lucide-react";
import { useShopData } from "@/context";
import { useShop } from "@/context/ShopContext";
import { useAuth } from "@/context/AuthContext";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { services, sales, loading } = useShopData();
  const { shop } = useShop();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const today = new Date().toISOString().split("T")[0];

  const todaysCash = useMemo(() => {
    const cashSales = sales
      .filter((s) => s.payment_mode === "cash" && s.created_at.startsWith(today))
      .reduce((sum, s) => sum + s.total_amount, 0);
    const cashServices = services
      .filter((s) => s.status === "delivered" && s.created_at.startsWith(today))
      .reduce((sum, s) => sum + s.estimated_cost, 0);
    return cashSales + cashServices;
  }, [sales, services, today]);

  const pendingRepairs = useMemo(() => services.filter((s) => s.status !== "delivered").length, [services]);

  const financeOwed = useMemo(
    () => sales.filter((s) => s.payment_mode === "emi").reduce((sum, s) => sum + (s.finance_balance ?? 0), 0),
    [sales]
  );

  const formatVal = (v: number) => {
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
    if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
    return `₹${v}`;
  };

  const recent = [
    ...services.slice(0, 3).map((s) => ({ 
      id: s.id, 
      type: "repair" as const, 
      title: `${s.device_model} — ${s.issue}`, 
      customer: s.customer_name, 
      amount: `₹${s.estimated_cost.toLocaleString("en-IN")}`, 
      time: s.created_at.split("T")[0],
      serviceId: s.id
    })),
    ...sales.slice(0, 3).map((s) => ({ 
      id: s.id, 
      type: "sale" as const, 
      title: s.item_name, 
      customer: s.customer_name, 
      amount: `₹${s.total_amount.toLocaleString("en-IN")}`, 
      time: s.created_at.split("T")[0],
      saleId: s.id
    })),
  ].slice(0, 5);

  const handleActivityClick = (item: typeof recent[0]) => {
    if (item.type === "repair") {
      // Navigate to Services page and show the repair details
      navigate(`/service?view=${item.serviceId}`);
    } else if (item.type === "sale") {
      // Navigate to Sales page and show the sale receipt
      navigate(`/sales?view=${item.saleId}`);
    }
  };

  if (loading) {
    return (
      <div className="px-4 pt-6 flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">Welcome back</p>
          <h1 className="text-2xl font-extrabold tracking-tight">{shop?.name ?? "Mobile Mart"}</h1>
        </div>
        <button onClick={signOut} className="touch-target flex items-center justify-center text-muted-foreground hover:text-foreground">
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-3">
        <BigCard label="Today's Cash" value={formatVal(todaysCash)} icon={IndianRupee} color="bg-success/10 text-success" />
        <BigCard label="Pending Repairs" value={String(pendingRepairs)} icon={Wrench} color="bg-warning/10 text-warning" />
        <BigCard label="Finance Owed" value={formatVal(financeOwed)} icon={Landmark} color="bg-primary/10 text-primary" />
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold">Recent Activity</h2>
        {recent.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No activity yet. Add your first service or sale!</p>}
        <div className="space-y-2">
          {recent.map((item) => (
            <button
              key={item.id}
              onClick={() => handleActivityClick(item)}
              className="glass-card p-4 flex items-center justify-between animate-fade-in w-full text-left hover:bg-muted/20 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${item.type === "repair" ? "bg-warning/10" : "bg-success/10"}`}>
                  {item.type === "repair" ? <Wrench className="h-5 w-5 text-warning" /> : <IndianRupee className="h-5 w-5 text-success" />}
                </div>
                <div>
                  <p className="text-sm font-semibold line-clamp-1">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.customer}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{item.amount}</p>
                <p className="text-xs text-muted-foreground">{item.time}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

function BigCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <div className="glass-card p-5 flex items-center justify-between animate-fade-in">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-extrabold tracking-tight mt-1">{value}</p>
      </div>
      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${color}`}>
        <Icon className="h-7 w-7" />
      </div>
    </div>
  );
}

export default Dashboard;
