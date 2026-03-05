import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { repairSchema } from "@/lib/schemas";
import { generateWhatsAppLink, generateRepairBillMessage } from "@/lib/billing";
import { useShopData } from "@/context";
import ThermalReceipt from "./ThermalReceipt";

interface RepairFormProps {
  onClose: () => void;
  editService?: string | null;
}

const RepairForm = ({ onClose, editService }: RepairFormProps) => {
  const { toast } = useToast();
  const { addService, updateService, services } = useShopData();
  const [saved, setSaved] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    customerName: "", phone: "", deviceModel: "", issue: "", estimatedCost: "",
    status: "received" as "received" | "in-progress" | "ready" | "delivered",
  });

  const isEditMode = !!editService;

  // Load existing service data for edit mode
  useState(() => {
    if (editService) {
      const service = services.find(s => s.id === editService);
      if (service) {
        setForm({
          customerName: service.customer_name,
          phone: service.phone,
          deviceModel: service.device_model,
          issue: service.issue,
          estimatedCost: service.estimated_cost.toString(),
          status: service.status as any,
        });
      }
    }
  });

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async () => {
    const parsed = repairSchema.safeParse({ 
      ...form, 
      estimatedCost: form.estimatedCost === "" ? 0 : Number(form.estimatedCost) || 0 
    });
    if (!parsed.success) {
      const newErrors: Record<string, string> = {};
      parsed.error.errors.forEach((e) => { newErrors[e.path[0] as string] = e.message; });
      setErrors(newErrors);
      return;
    }
    setSubmitting(true);
    
    if (isEditMode && editService) {
      await updateService(editService, {
        customer_name: parsed.data.customerName,
        phone: parsed.data.phone,
        device_model: parsed.data.deviceModel,
        issue: parsed.data.issue,
        estimated_cost: parsed.data.estimatedCost,
        status: parsed.data.status,
      });
      toast({ title: "Service updated!", description: `${parsed.data.deviceModel} — ${parsed.data.issue}` });
      onClose();
    } else {
      const result = await addService({
        customerName: parsed.data.customerName, phone: parsed.data.phone, deviceModel: parsed.data.deviceModel,
        issue: parsed.data.issue, estimatedCost: parsed.data.estimatedCost, status: parsed.data.status,
      });
      if (result) {
        setSaved(result);
        toast({ title: "Service order created!", description: `${parsed.data.deviceModel} — ${parsed.data.issue}` });
      } else {
        toast({ title: "Error saving", description: "Please try again", variant: "destructive" });
      }
    }
    
    setSubmitting(false);
  };

  if (saved && !isEditMode) {
    const waLink = generateWhatsAppLink(saved.phone, generateRepairBillMessage({
      id: saved.bill_id, customerName: saved.customer_name, deviceModel: saved.device_model,
      issue: saved.issue, estimatedCost: saved.estimated_cost, status: saved.status,
    }));
    return (
      <div className="px-4 pt-6 space-y-6 animate-fade-in pb-6">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={onClose} className="touch-target flex items-center justify-center"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-xl font-bold">SERVICE SLIP</h1>
        </div>
        <div className="overflow-auto rounded-2xl border border-border shadow-lg">
          <ThermalReceipt type="service" id={saved.bill_id} customerName={saved.customer_name} phone={saved.phone}
            date={new Date(saved.created_at).toLocaleDateString("en-IN")} deviceModel={saved.device_model}
            issue={saved.issue} estimatedCost={saved.estimated_cost} status={saved.status} />
        </div>
        <div className="space-y-3">
          <Button className="w-full h-14 rounded-xl bg-success hover:bg-success/90 text-success-foreground font-bold text-base" onClick={() => window.open(waLink, "_blank")}>
            📱 Share on WhatsApp
          </Button>
          <Button variant="outline" className="w-full h-14 rounded-xl font-semibold text-base" onClick={onClose}>Back to Services</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={onClose} className="touch-target flex items-center justify-center"><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-xl font-bold">{isEditMode ? "Edit Repair" : "New Repair"}</h1>
      </div>
      <div className="space-y-4">
        <FieldInput label="Customer Name" value={form.customerName} onChange={(v) => update("customerName", v)} error={errors.customerName} placeholder="Full name" />
        <FieldInput label="Phone Number" value={form.phone} onChange={(v) => update("phone", v)} error={errors.phone} placeholder="10-digit number" type="tel" maxLength={10} />
        <FieldInput label="Device Model" value={form.deviceModel} onChange={(v) => update("deviceModel", v)} error={errors.deviceModel} placeholder="e.g. iPhone 15 Pro" />
        <FieldInput label="Problem/Complaint" value={form.issue} onChange={(v) => update("issue", v)} error={errors.issue} placeholder="Describe the issue" />
        <FieldInput label="Estimated Cost (₹)" value={form.estimatedCost} onChange={(v) => update("estimatedCost", v)} error={errors.estimatedCost} placeholder="0 or leave empty" type="number" />

        <div className="space-y-2">
          <label className="text-sm font-bold">Status</label>
          <div className="grid grid-cols-2 gap-2">
            {(["received", "in-progress", "ready", "delivered"] as const).map((status) => (
              <button key={status} onClick={() => update("status", status)}
                className={`h-14 rounded-xl text-sm font-bold transition-all ${form.status === status ? "bg-primary text-primary-foreground shadow-md" : "bg-secondary text-muted-foreground"}`}>
                {status === "received" && "📥 Received"}
                {status === "in-progress" && "🔧 Repairing"}
                {status === "ready" && "✅ Ready"}
                {status === "delivered" && "🚚 Delivered"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button className="w-full h-14 rounded-xl font-bold text-base" onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Saving..." : (isEditMode ? "Update Info" : "Save & Generate Bill")} <Check className="h-5 w-5 ml-2" />
      </Button>
    </div>
  );
};

function FieldInput({ label, value, onChange, error, placeholder, type = "text", maxLength }: {
  label: string; value: string; onChange: (v: string) => void; error?: string; placeholder?: string; type?: string; maxLength?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-bold">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength} className="input-lg" />
      {error && <p className="text-xs text-destructive font-medium">{error}</p>}
    </div>
  );
}

export default RepairForm;
