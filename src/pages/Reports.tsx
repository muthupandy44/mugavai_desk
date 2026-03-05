import { useMemo, useCallback } from "react";
import { Download, Landmark, IndianRupee, Wrench, CreditCard } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
import { useShopData } from "@/context";
import { useToast } from "@/hooks/use-toast";

const Reports = () => {
  const { services, sales, loading } = useShopData();
  const { toast } = useToast();

  const today = new Date().toISOString().split("T")[0];

  const todaysCash = useMemo(() => {
    const cashSales = sales.filter((s) => s.payment_mode === "cash" && s.created_at.startsWith(today)).reduce((sum, s) => sum + s.total_amount, 0);
    const cashServices = services.filter((s) => s.status === "delivered" && s.created_at.startsWith(today)).reduce((sum, s) => sum + s.estimated_cost, 0);
    return cashSales + cashServices;
  }, [sales, services, today]);

  const pendingRepairs = useMemo(() => services.filter((s) => s.status !== "delivered").length, [services]);
  const financeOwed = useMemo(() => sales.filter((s) => s.payment_mode === "emi").reduce((sum, s) => sum + (s.finance_balance ?? 0), 0), [sales]);

  const chartData = useMemo(() => {
    const months: Record<string, { month: string; sales: number; services: number }> = {};
    const getKey = (d: string) => { const dt = new Date(d); return dt.toLocaleString("en-IN", { month: "short", year: "2-digit" }); };
    sales.forEach((s) => { const k = getKey(s.created_at); if (!months[k]) months[k] = { month: k, sales: 0, services: 0 }; months[k].sales += s.total_amount; });
    services.forEach((s) => { const k = getKey(s.created_at); if (!months[k]) months[k] = { month: k, sales: 0, services: 0 }; months[k].services += s.estimated_cost; });
    return Object.values(months);
  }, [sales, services]);

  const exportCSV = useCallback(() => {
    const rows = ["Type,BillID,Customer,Phone,Item,Amount,Mode,Date"];
    services.forEach((s) => rows.push(`Service,${s.bill_id},"${s.customer_name}",${s.phone},"${s.device_model}",${s.estimated_cost},${s.status},${s.created_at.split("T")[0]}`));
    sales.forEach((s) => rows.push(`Sale,${s.bill_id},"${s.customer_name}",${s.phone},"${s.item_name}",${s.total_amount},${s.payment_mode},${s.created_at.split("T")[0]}`));
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `mobile-mart-${today}.csv`; a.click();
    toast({ title: "CSV exported!", description: `${services.length + sales.length} records` });
  }, [services, sales, today, toast]);

  const fmt = (v: number) => { if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`; if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`; return `₹${v}`; };

  if (loading) {
    return <div className="px-4 pt-6 flex items-center justify-center min-h-[50vh]"><div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="px-4 pt-6 space-y-5 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">Reports</h1>
        <Button variant="outline" className="h-12 rounded-xl gap-2 font-bold" onClick={exportCSV}>
          <Download className="h-5 w-5" /> Export
        </Button>
      </div>

      <div className="space-y-3">
        <KpiCard label="Today's Cash" value={fmt(todaysCash)} icon={IndianRupee} color="bg-success/10 text-success" />
        <KpiCard label="Pending Repairs" value={String(pendingRepairs)} icon={Wrench} color="bg-warning/10 text-warning" />
        <KpiCard label="Finance Owed" value={fmt(financeOwed)} icon={Landmark} color="bg-primary/10 text-primary" />
      </div>

      {chartData.length > 0 && (
        <div className="glass-card p-4 space-y-4">
          <h2 className="text-sm font-bold">Sales vs Service Revenue</h2>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 90%)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "hsl(215 16% 47%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(215 16% 47%)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} width={40} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid hsl(214 32% 90%)", borderRadius: "12px", fontSize: "12px" }} formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, ""]} />
                <Bar dataKey="sales" name="Sales" fill="hsl(142 71% 45%)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="services" name="Service" fill="hsl(225 73% 57%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 text-xs font-semibold">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-success" /> Sales</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-primary" /> Service</span>
          </div>
        </div>
      )}

      <div className="glass-card p-4 space-y-3">
        <h2 className="text-sm font-bold">Summary</h2>
        <SummaryRow icon={IndianRupee} color="bg-success/10 text-success" label={`Total Sales (${sales.length})`} value={fmt(sales.reduce((s, r) => s + r.total_amount, 0))} />
        <SummaryRow icon={Wrench} color="bg-warning/10 text-warning" label={`Total Repairs (${services.length})`} value={fmt(services.reduce((s, r) => s + r.estimated_cost, 0))} />
        <SummaryRow icon={CreditCard} color="bg-primary/10 text-primary" label={`EMI Sales (${sales.filter(s => s.payment_mode === "emi").length})`} value={fmt(sales.filter(s => s.payment_mode === "emi").reduce((sum, s) => sum + s.total_amount, 0))} />
      </div>
    </div>
  );
};

function KpiCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
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

function SummaryRow({ icon: Icon, color, label, value }: { icon: React.ElementType; color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${color}`}><Icon className="h-4 w-4" /></div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-sm font-bold">{value}</span>
    </div>
  );
}

export default Reports;
