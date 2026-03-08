import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminLogin() {
  const { user, isAdmin, loading: authLoading, signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const attemptedLogin = useRef(false);

  useEffect(() => {
    if (authLoading || !user) return;
    if (isAdmin) {
      navigate("/admin/dashboard", { replace: true });
    } else if (attemptedLogin.current) {
      // Logged in successfully but not an admin
      attemptedLogin.current = false;
      signOut();
      setLoading(false);
      setError("You don't have admin access.");
      toast.error("You don't have admin access to this portal.");
    }
  }, [authLoading, user, isAdmin]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    attemptedLogin.current = true;
    const { error: err } = await signIn(email, password);
    if (err) {
      attemptedLogin.current = false;
      setLoading(false);
      setError("Invalid credentials");
      toast.error("Invalid credentials. Please check your email and password.");
      return;
    }
    // Navigation will happen via the useEffect above
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    toast.success("Password reset email sent! Check your inbox.");
    setResetMode(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-display text-xl">
            {resetMode ? "Reset Password" : "Admin Login"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {resetMode ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input id="reset-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={resetLoading}>
                {resetLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send Reset Link
              </Button>
              <Button type="button" variant="link" className="w-full" onClick={() => { setResetMode(false); setError(""); }}>
                Back to login
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sign In
              </Button>
              <Button type="button" variant="link" className="w-full" onClick={() => { setResetMode(true); setError(""); }}>
                Forgot password?
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
