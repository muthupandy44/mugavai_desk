import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (isSignUp && (!shopName || !shopAddress)) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setLoading(true);

    if (isSignUp) {
      // First create the user account
      const { error: signUpError } = await signUp(email, password);
      
      if (signUpError) {
        toast({ title: "Error", description: signUpError, variant: "destructive" });
      } else {
        // Immediately create the shop after successful signup
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { error: shopError } = await supabase
              .from("shops")
              .insert({
                name: shopName,
                address: shopAddress,
                owner_id: user.id
              })
              .select()
              .single();
            
            if (shopError) {
              console.error('Failed to create shop:', shopError.message);
              toast({ 
                title: "Account created!", 
                description: "But shop creation failed. Please contact support.",
                variant: "destructive" 
              });
            } else {
              toast({ 
                title: "Account created!", 
                description: "Your shop has been set up successfully. You can now sign in." 
              });
            }
          }
        } catch (error) {
          toast({ 
            title: "Account created!", 
            description: "Please check your email to confirm, then sign in." 
          });
        }
      }
    } else {
      // Regular sign in
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Error", description: error, variant: "destructive" });
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Mobile Mart</h1>
          <p className="text-muted-foreground text-sm font-medium">
            {isSignUp ? "Create your account" : "Sign in to your shop"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-bold">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@shop.com"
              className="input-lg"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••••••"
              className="input-lg"
              minLength={6}
              required
            />
          </div>
          
          {isSignUp && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-bold">Shop Name</label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="My Mobile Shop"
                  className="input-lg"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold">Shop Address</label>
                <input
                  type="text"
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                  placeholder="123 Main St, City, State"
                  className="input-lg"
                  required
                />
              </div>
            </>
          )}
          
          <Button type="submit" className="w-full h-14 rounded-xl font-bold text-base" disabled={loading}>
            {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary font-bold hover:underline">
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
