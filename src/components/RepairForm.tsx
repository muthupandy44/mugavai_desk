import { useState, useMemo } from "react";
import { ArrowLeft, Check, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { repairSchema } from "@/lib/schemas";
import { generateWhatsAppLink, generateRepairBillMessage } from "@/lib/billing";
import { useShopData } from "@/context";
import A4Invoice from "./Invoice";

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
    imeiNumber: "", hsnCode: "9987", taxableAmount: "", gstAmount: "", amountInWords: "",
    status: "received" as "received" | "in-progress" | "ready" | "delivered",
    isTaxInvoice: false,
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
          imeiNumber: service.imei_number || "",
          hsnCode: service.hsn_code || "9987",
          taxableAmount: service.taxable_amount?.toString() || "",
          gstAmount: service.gst_amount?.toString() || "",
          amountInWords: service.amount_in_words || "",
          isTaxInvoice: !!service.taxable_amount,
        });
      }
    }
  });

  // Function to convert number to words
  const numberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero';
    
    const convert = (n: number): string => {
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
      if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
      if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
      return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
    };
    
    return convert(num) + ' Rupees Only';
  };

  const update = (field: string, value: string | boolean) => {
    const newForm = { ...form, [field]: value };
    
    // Auto-calculate tax fields when tax invoice is enabled
    if (field === 'estimatedCost' || field === 'isTaxInvoice') {
      const cost = Number(newForm.estimatedCost) || 0;
      if (newForm.isTaxInvoice && cost > 0) {
        const taxableAmount = Math.round(cost / 1.18);
        const gstAmount = cost - taxableAmount;
        newForm.taxableAmount = taxableAmount.toString();
        newForm.gstAmount = gstAmount.toString();
        newForm.amountInWords = numberToWords(cost);
      } else if (cost > 0) {
        newForm.amountInWords = numberToWords(cost);
        newForm.taxableAmount = '';
        newForm.gstAmount = '';
      }
    }
    
    setForm(newForm);
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
        imei_number: form.imeiNumber,
        hsn_code: form.hsnCode,
        taxable_amount: form.taxableAmount ? Number(form.taxableAmount) : null,
        gst_amount: form.gstAmount ? Number(form.gstAmount) : null,
        amount_in_words: form.amountInWords,
      });
      toast({ title: "Service updated!", description: `${parsed.data.deviceModel} — ${parsed.data.issue}` });
      onClose();
    } else {
      const result = await addService({
        customerName: parsed.data.customerName, phone: parsed.data.phone, deviceModel: parsed.data.deviceModel,
        issue: parsed.data.issue, estimatedCost: parsed.data.estimatedCost, status: parsed.data.status,
        imeiNumber: form.imeiNumber,
        hsnCode: form.hsnCode,
        taxableAmount: form.taxableAmount ? Number(form.taxableAmount) : null,
        gstAmount: form.gstAmount ? Number(form.gstAmount) : null,
        amountInWords: form.amountInWords,
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
          <A4Invoice
            customerName={saved.customer_name}
            phone={saved.phone}
            billNo={saved.bill_id}
            date={new Date(saved.created_at).toLocaleDateString("en-IN")}
            items={[
              {
                description: `Service: ${saved.issue}`,
                model: saved.device_model,
                imei1: saved.imei_number || undefined,
                quantity: 1,
                rate: saved.estimated_cost,
                amount: saved.estimated_cost
              }
            ]}
            subtotal={saved.taxable_amount || saved.estimated_cost}
            gst={saved.gst_amount || Math.round(saved.estimated_cost * 0.18)}
            total={saved.estimated_cost + (saved.gst_amount || Math.round(saved.estimated_cost * 0.18))}
            amountInWords={saved.amount_in_words || ''}
            status={saved.status}
            isTaxInvoice={!!saved.taxable_amount}
          />
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
        <FieldInput label="IMEI/Serial Number" value={form.imeiNumber} onChange={(v) => update("imeiNumber", v)} placeholder="Optional IMEI or serial number" />
        
        {/* Tax Invoice Toggle */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold">Generate Tax Invoice</span>
          </div>
          <Switch
            checked={form.isTaxInvoice}
            onCheckedChange={(checked) => update("isTaxInvoice", checked)}
          />
        </div>

        {/* Conditional Tax Fields */}
        {form.isTaxInvoice && (
          <div className="grid grid-cols-2 gap-3">
            <FieldInput label="HSN Code" value={form.hsnCode} onChange={(v) => update("hsnCode", v)} placeholder="9987" />
            <FieldInput label="Taxable Amount (₹)" value={form.taxableAmount} onChange={(v) => update("taxableAmount", v)} placeholder="Auto-calculated" type="number" readOnly />
          </div>
        )}

        {form.isTaxInvoice && (
          <FieldInput label="GST Amount (₹)" value={form.gstAmount} onChange={(v) => update("gstAmount", v)} placeholder="Auto-calculated (18%)" type="number" readOnly />
        )}

        <FieldInput label="Problem/Complaint" value={form.issue} onChange={(v) => update("issue", v)} error={errors.issue} placeholder="Describe the issue" />
        <FieldInput label={form.isTaxInvoice ? "Total Amount (₹)" : "Estimated Cost (₹)"} value={form.estimatedCost} onChange={(v) => update("estimatedCost", v)} error={errors.estimatedCost} placeholder={form.isTaxInvoice ? "Total amount including GST" : "0 or leave empty"} type="number" />

        {/* Amount in Words Display */}
        {form.amountInWords && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-xs font-bold text-blue-600 mb-1">Amount in Words:</p>
            <p className="text-sm font-semibold text-blue-800">{form.amountInWords}</p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-bold">Status</label>
          <div className="grid grid-cols-2 gap-2">
            {(["received", "in-progress", "ready", "delivered"] as const).map((status) => {
              const statusColors = {
                "received": "bg-blue-500 text-white",
                "in-progress": "bg-yellow-500 text-white", 
                "ready": "bg-green-500 text-white",
                "delivered": "bg-green-600 text-white"
              };
              const inactiveColors = {
                "received": "bg-blue-100 text-blue-700",
                "in-progress": "bg-yellow-100 text-yellow-700",
                "ready": "bg-green-100 text-green-700", 
                "delivered": "bg-green-100 text-green-700"
              };
              return (
                <button key={status} onClick={() => update("status", status)}
                  className={`h-14 rounded-xl text-sm font-bold transition-all ${
                    form.status === status 
                      ? `${statusColors[status]} shadow-lg scale-105` 
                      : `${inactiveColors[status]} hover:scale-102`
                  }`}>
                  {status === "received" && "📥 Received"}
                  {status === "in-progress" && "🔧 Repairing"}
                  {status === "ready" && "✅ Ready"}
                  {status === "delivered" && "🚚 Delivered"}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Button className="w-full h-14 rounded-xl font-bold text-base" onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Saving..." : (isEditMode ? "Update Info" : "Save & Generate Bill")} <Check className="h-5 w-5 ml-2" />
      </Button>
    </div>
  );
};

function FieldInput({ label, value, onChange, error, placeholder, type = "text", maxLength, readOnly }: {
  label: string; value: string; onChange: (v: string) => void; error?: string; placeholder?: string; type?: string; maxLength?: number; readOnly?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-bold">{label}</label>
      <input 
        type={type} 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder={placeholder} 
        maxLength={maxLength} 
        readOnly={readOnly}
        className={`input-lg ${readOnly ? 'bg-muted/50 cursor-not-allowed' : ''}`} 
      />
      {error && <p className="text-xs text-destructive font-medium">{error}</p>}
    </div>
  );
}

export default RepairForm;
