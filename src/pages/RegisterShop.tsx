import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useShop } from "@/context/ShopContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Store, LogOut } from "lucide-react";

const RegisterShop = () => {
  const { registerShop } = useShop();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const { error } = await registerShop(name.trim(), address.trim());
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Shop registered!", description: "Welcome to Mobile Mart." });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Store className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Register Your Shop</h1>
          <p className="text-muted-foreground text-sm">Set up your shop to start managing services & sales.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-bold">Shop Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mobile Mart"
              className="input-lg"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold">Address</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Shop address (optional)"
              className="input-lg"
            />
          </div>
          <Button type="submit" className="w-full h-14 rounded-xl font-bold text-base" disabled={loading}>
            {loading ? "Creating..." : "Register Shop"}
          </Button>
        </form>

        <button onClick={signOut} className="flex items-center justify-center gap-2 w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );
};

export default RegisterShop;
