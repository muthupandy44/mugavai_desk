import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Wrench, Clock, CheckCircle2, PackageCheck, Pencil, Trash2, IndianRupee, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import RepairForm from "@/components/RepairForm";
import FinalBillDialog from "@/components/FinalBillDialog";
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
import { generateWhatsAppLink, generateRepairBillMessage } from "@/lib/billing";
import { useSearchParams } from "react-router-dom";

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  received: { label: "Received", icon: Clock, color: "text-warning bg-warning/10" },
  "in-progress": { label: "Repairing", icon: Wrench, color: "text-primary bg-primary/10" },
  ready: { label: "Ready", icon: PackageCheck, color: "text-success bg-success/10" },
  delivered: { label: "Delivered", icon: CheckCircle2, color: "text-muted-foreground bg-muted" },
};

const statusFlow = ["received", "in-progress", "ready", "delivered"];

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

const Service = () => {
  const { services, deleteService, updateService, loading, hasMoreServices, loadMoreServices } = useShopData();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [editService, setEditService] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewReceipt, setViewReceipt] = useState<string | null>(null);
  const [finalBillDialog, setFinalBillDialog] = useState<string | null>(null);
  const [isFinalBill, setIsFinalBill] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deliveryPrompt, setDeliveryPrompt] = useState<string | null>(null);

  // Check for URL parameters to view specific service
  useEffect(() => {
    const viewId = searchParams.get('view');
    if (viewId && services.length > 0) {
      const service = services.find(s => s.id === viewId);
      if (service) {
        setViewReceipt(viewId);
      }
    }
  }, [searchParams, services]);

  // Enhanced search across multiple fields
  const filteredServices = useMemo(() => {
    let filtered = services;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    // Apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((s) => 
        s.device_model.toLowerCase().includes(searchLower) ||
        s.customer_name.toLowerCase().includes(searchLower) ||
        s.phone.includes(searchLower) ||
        s.issue.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [services, statusFilter, search]);

  // Group filtered services by date
  const groupedServices = useMemo(() => {
    return groupByDate(filteredServices);
  }, [filteredServices]);

  if (showForm) return <RepairForm onClose={() => { setShowForm(false); setEditService(null); }} editService={editService} />;

  const receiptOrder = viewReceipt ? services.find((s) => s.id === viewReceipt) : null;

  const handleFinalBill = (service: any) => {
    setViewReceipt(service.id);
    setIsFinalBill(true);
  };

  const handleCloseReceipt = () => {
    setViewReceipt(null);
    setIsFinalBill(false);
  };

  const handleEdit = (serviceId: string) => {
    setEditService(serviceId);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteService(deleteId);
    setDeleteId(null);
    toast({ title: "Service deleted" });
  };

  const handleStatusChange = async (id: string, currentStatus: string) => {
    const idx = statusFlow.indexOf(currentStatus);
    if (idx < statusFlow.length - 1) {
      const next = statusFlow[idx + 1];
      
      // If changing to "delivered" and estimated cost is 0, prompt for final amount
      if (next === "delivered") {
        const service = services.find(s => s.id === id);
        if (service && service.estimated_cost === 0) {
          setDeliveryPrompt(id);
          return;
        }
      }
      
      await updateService(id, { status: next });
      toast({ title: `Status updated to ${statusConfig[next]?.label ?? next}` });
    }
  };

  const handleDeliveryConfirm = async () => {
    if (!deliveryPrompt) return;
    
    // For now, just update status to delivered
    // In a real implementation, you might want to open a dialog to enter the final amount
    await updateService(deliveryPrompt, { status: "delivered" });
    toast({ title: "Status updated to Delivered", description: "Consider updating the final service charges" });
    setDeliveryPrompt(null);
  };

  if (receiptOrder) {
    const waLink = generateWhatsAppLink(receiptOrder.phone, generateRepairBillMessage({
      id: receiptOrder.bill_id, customerName: receiptOrder.customer_name, deviceModel: receiptOrder.device_model,
      issue: receiptOrder.issue, estimatedCost: receiptOrder.estimated_cost, status: receiptOrder.status,
      isFinalBill: isFinalBill
    }));
    return (
      <div className="px-4 pt-6 space-y-6 animate-fade-in pb-6">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={handleCloseReceipt} className="touch-target flex items-center justify-center">←</button>
          <h1 className="text-xl font-bold">{isFinalBill ? 'FINAL BILL' : 'SERVICE SLIP'} — {receiptOrder.bill_id}</h1>
        </div>
        <div className="overflow-auto rounded-2xl border border-border shadow-lg">
          <ThermalReceipt 
            type="service" 
            id={receiptOrder.bill_id} 
            customerName={receiptOrder.customer_name} 
            phone={receiptOrder.phone}
            date={new Date(receiptOrder.created_at).toLocaleDateString("en-IN")} 
            deviceModel={receiptOrder.device_model}
            issue={receiptOrder.issue} 
            estimatedCost={receiptOrder.estimated_cost} 
            status={receiptOrder.status}
            isFinalBill={isFinalBill}
            finalAmount={isFinalBill ? receiptOrder.estimated_cost : undefined}
            shopName={services.find(s => s.id === viewReceipt)?.shop?.name || "Mobile Shop"}
          />
        </div>
        <div className="space-y-3">
          <Button className="w-full h-14 rounded-xl bg-success hover:bg-success/90 text-success-foreground font-bold text-base" onClick={() => window.open(waLink, "_blank")}>
            📱 Share on WhatsApp
          </Button>
          <Button variant="outline" className="w-full h-14 rounded-xl font-semibold text-base" onClick={handleCloseReceipt}>Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-extrabold tracking-tight">Services</h1>
        <Button className="h-14 px-5 rounded-xl font-bold text-base" onClick={() => { setShowForm(true); setEditService(null); }}>
          <Plus className="h-5 w-5 mr-1" /> New Repair
        </Button>
      </div>

      <div className="relative">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input 
            placeholder="Search by name, phone, device, or issue..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="input-lg pl-12 flex-1" 
          />
        </div>
      </div>

      {/* Quick Filter Chips */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Status:</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "received", "in-progress", "ready", "delivered"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                statusFilter === status
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-muted"
              }`}
            >
              {status === "all" && "All"}
              {status === "received" && "📥 Received"}
              {status === "in-progress" && "🔧 Repairing"}
              {status === "ready" && "✅ Ready"}
              {status === "delivered" && "🚚 Delivered"}
            </button>
          ))}
        </div>
      </div>

      {loading && services.length === 0 && (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Grouped Services by Date */}
      <div className="space-y-6">
        {Object.entries(groupedServices).map(([dateGroup, items]) => {
          if (items.length === 0) return null;
          
          return (
            <div key={dateGroup} className="space-y-3">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                {dateGroup} ({items.length})
              </h3>
              <div className="space-y-2">
                {items.map((order) => {
                  const status = statusConfig[order.status] || statusConfig["received"];
                  return (
                    <div key={order.id} className="glass-card p-4 space-y-3 animate-fade-in">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 cursor-pointer" onClick={() => setViewReceipt(order.id)}>
                          <p className="text-base font-bold">{order.device_model}</p>
                          <p className="text-sm text-muted-foreground">{order.issue}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {order.status === "ready" ? (
                            <button
                              onClick={() => setFinalBillDialog(order.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-success hover:bg-success/90 text-success-foreground transition-all active:scale-95"
                            >
                              <IndianRupee className="h-3.5 w-3.5" />
                              Complete & Bill
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(order.id, order.status)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${status.color} transition-all active:scale-95`}
                            >
                              <status.icon className="h-3.5 w-3.5" />
                              {status.label}
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(order.id)}
                            className="p-1.5 rounded-lg hover:bg-muted/10 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-muted-foreground">{order.customer_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">
                            {order.estimated_cost === 0 ? "To Be Informed" : `₹${order.estimated_cost.toLocaleString("en-IN")}`}
                          </span>
                          <button onClick={() => setDeleteId(order.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More Button */}
      {hasMoreServices && !loading && (
        <Button 
          variant="outline" 
          className="w-full h-14 rounded-xl font-semibold text-base" 
          onClick={loadMoreServices}
          disabled={loading}
        >
          {loading ? "Loading..." : "Load More Services"}
        </Button>
      )}

      {!loading && filteredServices.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-12">
          {search || statusFilter !== "all" ? "No services match your filters" : "No services found"}
        </p>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this service?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The service record will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delivery Confirmation Dialog */}
      <AlertDialog open={!!deliveryPrompt} onOpenChange={() => setDeliveryPrompt(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Service Delivery?</AlertDialogTitle>
            <AlertDialogDescription>
              This service has no estimated cost. Consider updating the final service charges before marking as delivered for accurate cash tracking.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Update Charges First</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeliveryConfirm}>
              Mark as Delivered
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FinalBillDialog 
        open={!!finalBillDialog} 
        onOpenChange={() => setFinalBillDialog(null)} 
        serviceId={finalBillDialog || ""}
        onBillGenerated={handleFinalBill}
      />
    </div>
  );
};

export default Service;
