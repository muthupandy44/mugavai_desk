import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useState } from "react";

const EmergencyReset = () => {
  const { toast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleEmergencyReset = () => {
    try {
      // Clear ALL localStorage data
      localStorage.clear();
      
      // Show success feedback
      toast({ 
        title: "Emergency Reset Complete", 
        description: "All local data has been cleared. Refresh the page to continue.",
        duration: 5000
      });
      
      setShowConfirm(false);
      
      // Auto-refresh after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error("Emergency reset failed:", error);
      toast({ 
        title: "Reset Failed", 
        description: "Please try again or refresh the page manually.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowConfirm(true)}
        className="text-xs text-muted-foreground border-muted-foreground/20 hover:border-destructive/50 hover:text-destructive"
      >
        <AlertTriangle className="h-3 w-3 mr-1" />
        Emergency Reset
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Emergency Reset
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will clear ALL stored data including drafts, settings, and cache. 
              Use this only if the app is stuck in a loop or not responding properly.
              The page will automatically refresh after the reset.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleEmergencyReset} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EmergencyReset;
