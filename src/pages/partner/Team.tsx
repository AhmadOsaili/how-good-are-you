import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePartnerAuth } from "@/hooks/usePartnerAuth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type TeamMember = {
  id: string;
  user_id: string;
  company_role: string;
  created_at: string;
  email?: string;
};

export default function Team() {
  const { partnerInfo } = usePartnerAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("member");
  const { toast } = useToast();

  useEffect(() => {
    if (partnerInfo?.companyId) fetchMembers();
  }, [partnerInfo?.companyId]);

  async function fetchMembers() {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("company_users")
      .select("id, user_id, company_role, created_at")
      .eq("company_id", partnerInfo!.companyId);

    setMembers((data as TeamMember[]) || []);
    setLoading(false);
  }

  async function inviteMember() {
    if (!email || !password) return;
    setSaving(true);

    const { data, error } = await supabase.functions.invoke("invite-partner", {
      body: {
        email,
        password,
        company_id: partnerInfo!.companyId,
        company_role: role,
      },
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (data?.error) {
      toast({ title: "Error", description: data.error, variant: "destructive" });
    } else {
      toast({ title: "Team member added", description: `Invited ${email} successfully.` });
      setDialogOpen(false);
      setEmail("");
      setPassword("");
      setRole("member");
      fetchMembers();
    }
    setSaving(false);
  }

  async function removeMember(id: string) {
    const { error } = await (supabase as any)
      .from("company_users")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Member removed" });
      fetchMembers();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Team Members</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Member
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : members.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No team members yet.</p>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs">{m.user_id}</TableCell>
                  <TableCell>
                    <Badge className={m.company_role === "company_admin" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}>
                      {m.company_role === "company_admin" ? "Admin" : "Member"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(m.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove team member?</AlertDialogTitle>
                          <AlertDialogDescription>They will lose access to the partner dashboard.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => removeMember(m.id)}>Remove</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="partner@company.com" />
            </div>
            <div className="space-y-2">
              <Label>Temporary Password</Label>
              <Input type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder="Set initial password" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="company_admin">Company Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={inviteMember} disabled={!email || !password || saving} className="w-full">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Add Member
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
