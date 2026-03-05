import { useState } from "react";
import { IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useShopData } from "@/context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FinalBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceId: string;
  onBillGenerated: (service: any) => void;
}

const FinalBillDialog = ({ open, onOpenChange, serviceId, onBillGenerated }: FinalBillDialogProps) => {
  const { toast } = useToast();
  const { updateService, services } = useShopData();
  const [finalAmount, setFinalAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const service = services.find(s => s.id === serviceId);

  const handleSubmit = async () => {
    const amount = Number(finalAmount);
    if (!amount || amount <= 0) {
      toast({ 
        title: "Invalid amount", 
        description: "Please enter a valid final amount",
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);
    try {
      // Update estimated_cost to be the final amount and change status to delivered
      await updateService(serviceId, { 
        estimated_cost: amount,
        status: "delivered" 
      });
      
      const updatedService = { ...service!, estimated_cost: amount, status: "delivered" };
      onBillGenerated(updatedService);
      
      toast({ 
        title: "Final Bill Generated!", 
        description: `Final amount: ₹${amount.toLocaleString("en-IN")}` 
      });
      
      onOpenChange(false);
      setFinalAmount("");
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to generate final bill",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5" />
            Complete & Bill
          </DialogTitle>
          <DialogDescription>
            Enter final repair amount for {service?.device_model}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold">Final Repair Amount (₹)</label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="number"
                value={finalAmount}
                onChange={(e) => setFinalAmount(e.target.value)}
                placeholder="0"
                className="w-full h-12 rounded-xl border border-border bg-card pl-10 pr-4 text-lg font-bold placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          
          {service?.estimated_cost && service.estimated_cost > 0 && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Estimated: ₹{service.estimated_cost.toLocaleString("en-IN")}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading || !finalAmount}
            className="bg-success hover:bg-success/90 text-success-foreground"
          >
            {loading ? "Generating..." : "Generate Final Bill"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FinalBillDialog;
