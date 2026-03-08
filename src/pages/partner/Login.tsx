import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { toast } from "sonner";

export default function PartnerLogin() {
  const { user, isPartner, isPartnerMember, loading, rolesChecked, signIn, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const attemptedLogin = useRef(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user || !rolesChecked) return;
    if (isPartner || isPartnerMember) {
      navigate("/partner/leads", { replace: true });
    } else if (attemptedLogin.current) {
      attemptedLogin.current = false;
      signOut();
      setSubmitting(false);
      setError("You don't have partner access.");
      toast.error("You don't have partner access to this portal.");
      toast.error("You don't have partner access to this portal.");
    }
  }, [loading, user, isPartner, isPartnerMember, rolesChecked]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    attemptedLogin.current = true;
    const { error: err } = await signIn(email, password);
    if (err) {
      attemptedLogin.current = false;
      setError("Invalid credentials");
      toast.error(err.message);
      setSubmitting(false);
    }
    // Navigation will happen via the useEffect above
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Partner Login</CardTitle>
          <CardDescription>Sign in to access your assigned leads</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign In"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              <Link to="/reset-password" className="underline">
                Forgot password?
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
