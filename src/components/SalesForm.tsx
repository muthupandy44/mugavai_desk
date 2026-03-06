import { useState, useMemo } from "react";
import { ArrowLeft, Check, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { salesSchema, financeProviders } from "@/lib/schemas";
import { generateWhatsAppLink, generateSalesBillMessage } from "@/lib/billing";
import { useShopData } from "@/context";
import A4Invoice from "./Invoice";
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
import type { SaleRecord } from "@/context";

interface SalesFormProps {
  onClose: () => void;
  editSale?: string | null;
}

const SalesForm = ({ onClose, editSale }: SalesFormProps) => {
  const { toast } = useToast();
  const { addSale, updateSale, sales } = useShopData();
  const navigate = useNavigate();
  const [saved, setSaved] = useState<SaleRecord | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [form, setForm] = useState({
    customerName: "", phone: "", itemName: "", totalAmount: "",
    paymentMode: "cash" as "cash" | "emi", downpayment: "",
    financeProvider: "" as "" | "bajaj" | "idfc" | "tvs" | "other",
    customFinanceProvider: "",
  });

  const isEditMode = !!editSale;

  // Load existing sale data for edit mode
  useState(() => {
    if (editSale) {
      const sale = sales.find(s => s.id === editSale);
      if (sale) {
        setForm({
          customerName: sale.customer_name,
          phone: sale.phone,
          itemName: sale.item_name,
          totalAmount: sale.total_amount.toString(),
          paymentMode: sale.payment_mode as any,
          downpayment: sale.downpayment?.toString() || "",
          financeProvider: (sale.finance_provider as any) || "",
          customFinanceProvider: "",
        });
      }
    }
  });

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const financeBalance = useMemo(() => {
    if (form.paymentMode !== "emi") return 0;
    return Math.max(0, (Number(form.totalAmount) || 0) - (Number(form.downpayment) || 0));
  }, [form.totalAmount, form.downpayment, form.paymentMode]);

  const handleClearForm = () => {
    setForm({
      customerName: "", phone: "", itemName: "", totalAmount: "",
      paymentMode: "cash" as "cash" | "emi", downpayment: "",
      financeProvider: "" as "" | "bajaj" | "idfc" | "tvs" | "other",
      customFinanceProvider: "",
    });
    setErrors({});
    setShowClearConfirm(false);
    toast({ title: "Form cleared", description: "All entered details have been removed" });
  };

  const handleSubmit = async () => {
    const payload: Record<string, unknown> = {
      customerName: form.customerName, phone: form.phone, itemName: form.itemName,
      totalAmount: Number(form.totalAmount) || undefined, paymentMode: form.paymentMode,
    };
    if (form.paymentMode === "emi") {
      payload.downpayment = Number(form.downpayment) || undefined;
      payload.financeProvider = form.financeProvider || undefined;
    }

    const result = salesSchema.safeParse(payload);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => { newErrors[e.path[0] as string] = e.message; });
      setErrors(newErrors);
      return;
    }

    const providerName = form.financeProvider === "other" ? (form.customFinanceProvider || "Other") : form.financeProvider;

    setSubmitting(true);
    
    if (isEditMode && editSale) {
      await updateSale(editSale, {
        customer_name: result.data.customerName,
        phone: result.data.phone,
        item_name: result.data.itemName,
        total_amount: result.data.totalAmount,
        payment_mode: result.data.paymentMode,
        downpayment: result.data.downpayment,
        finance_provider: result.data.paymentMode === "emi" ? providerName : undefined,
        finance_balance: result.data.paymentMode === "emi" ? financeBalance : undefined,
      });
      toast({ title: "Sale updated!", description: `${result.data.itemName} — ₹${result.data.totalAmount?.toLocaleString("en-IN")}` });
      onClose();
    } else {
      const data = await addSale({
        customerName: result.data.customerName, phone: result.data.phone, itemName: result.data.itemName,
        totalAmount: result.data.totalAmount, paymentMode: result.data.paymentMode,
        downpayment: result.data.paymentMode === "emi" ? result.data.downpayment : undefined,
        financeProvider: result.data.paymentMode === "emi" ? providerName : undefined,
        financeBalance: result.data.paymentMode === "emi" ? financeBalance : undefined,
      });
      setSubmitting(false);

      if (data) {
        setSaved(data);
        toast({ title: "Sale recorded!", description: `${result.data.itemName} — ₹${result.data.totalAmount?.toLocaleString("en-IN")}` });
        
        // Auto-redirect to bill view
        navigate(`/sales?view=${data.id}`);
        
        // Instant print option
        setTimeout(() => {
          window.print();
        }, 1000);
      } else {
        setSubmitting(false);
        toast({ title: "Error saving", description: "Please try again", variant: "destructive" });
      }
    }
  };

  if (saved && !isEditMode) {
    const waLink = generateWhatsAppLink(saved.phone, generateSalesBillMessage({
      id: saved.bill_id, customerName: saved.customer_name, itemName: saved.item_name,
      totalAmount: saved.total_amount, paymentMode: saved.payment_mode,
      downpayment: saved.downpayment ?? undefined, financeProvider: saved.finance_provider ?? undefined,
    }));
    return (
      <div className="px-4 pt-6 space-y-6 animate-fade-in pb-6">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={onClose} className="touch-target flex items-center justify-center"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-xl font-bold">Receipt</h1>
        </div>
        <div className="overflow-auto rounded-2xl border border-border shadow-lg">
          <A4Invoice
            customerName={saved.customer_name}
            phone={saved.phone}
            billNo={saved.bill_id}
            date={new Date(saved.created_at).toLocaleDateString("en-IN")}
            items={[
              {
                description: saved.item_name,
                quantity: 1,
                rate: saved.total_amount,
                amount: saved.total_amount
              }
            ]}
            subtotal={saved.total_amount}
            gst={Math.round(saved.total_amount * 0.18)}
            total={saved.total_amount + Math.round(saved.total_amount * 0.18)}
            amountInWords={''} // Will be calculated in component
          />
        </div>
        <div className="space-y-3">
          <Button className="w-full h-14 rounded-xl bg-success hover:bg-success/90 text-success-foreground font-bold text-base" onClick={() => window.open(waLink, "_blank")}>
            📱 Share on WhatsApp
          </Button>
          <Button className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base" onClick={() => window.print()}>
            🖨️ Print Now
          </Button>
          <Button variant="outline" className="w-full h-14 rounded-xl font-semibold text-base" onClick={onClose}>Done</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={onClose} className="touch-target flex items-center justify-center"><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-xl font-bold">{isEditMode ? "Edit Sale" : "New Sale"}</h1>
      </div>
      <div className="space-y-4">
        <FieldInput label="Customer Name" value={form.customerName} onChange={(v) => update("customerName", v)} error={errors.customerName} placeholder="Full name" />
        <FieldInput label="Phone Number" value={form.phone} onChange={(v) => update("phone", v)} error={errors.phone} placeholder="10-digit number" type="tel" maxLength={10} />
        <FieldInput label="Product / Item" value={form.itemName} onChange={(v) => update("itemName", v)} error={errors.itemName} placeholder="e.g. Samsung Galaxy A54" />
        <FieldInput label="Total Price (₹)" value={form.totalAmount} onChange={(v) => update("totalAmount", v)} error={errors.totalAmount} placeholder="0" type="number" />

        <div className="space-y-2">
          <label className="text-sm font-bold">Payment Mode</label>
          <div className="flex rounded-xl bg-secondary p-1.5">
            {(["cash", "emi"] as const).map((mode) => (
              <button key={mode} onClick={() => update("paymentMode", mode)}
                className={`flex-1 h-14 rounded-lg text-base font-bold transition-all ${form.paymentMode === mode ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground"}`}>
                {mode.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {form.paymentMode === "emi" && (
          <div className="space-y-4 animate-fade-in">
            <FieldInput label="Downpayment (₹)" value={form.downpayment} onChange={(v) => update("downpayment", v)} error={errors.downpayment} placeholder="0" type="number" />
            <div className="space-y-2">
              <label className="text-sm font-bold">Finance Provider</label>
              <div className="grid grid-cols-2 gap-2">
                {financeProviders.map((fp) => (
                  <button key={fp.value} onClick={() => update("financeProvider", fp.value)}
                    className={`h-14 rounded-xl text-sm font-bold transition-all ${form.financeProvider === fp.value ? "bg-primary text-primary-foreground shadow-md" : "bg-secondary text-muted-foreground"}`}>
                    {fp.label}
                  </button>
                ))}
              </div>
              {errors.financeProvider && <p className="text-xs text-destructive font-medium">{errors.financeProvider}</p>}
            </div>

            {form.financeProvider === "other" && (
              <FieldInput label="Provider Name" value={form.customFinanceProvider} onChange={(v) => update("customFinanceProvider", v)} placeholder="Enter provider name" />
            )}

            <div className="glass-card p-5 flex items-center justify-between">
              <span className="text-sm font-bold text-muted-foreground">Finance Balance</span>
              <span className="text-2xl font-extrabold text-primary">₹{financeBalance.toLocaleString("en-IN")}</span>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Button className="w-full h-14 rounded-xl font-bold text-base" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Saving..." : (isEditMode ? "Update Info" : "Save & Generate Bill")} <Check className="h-5 w-5 ml-2" />
        </Button>
        {!isEditMode && (
          <Button type="button" variant="outline" className="w-full h-14 rounded-xl font-semibold text-base" onClick={() => setShowClearConfirm(true)} disabled={submitting}>
            Clear Form
          </Button>
        )}
      </div>

      {/* Clear Form Confirmation Dialog */}
      {showClearConfirm && (
        <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear all entered details?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove all the information you've entered. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearForm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Clear Form
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
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

export default SalesForm;
