import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { companyFormSchema, CompanyFormValues } from "@/lib/validations";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, UserPlus } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type Company = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  service_area: string[];
  website: string | null;
  notes: string | null;
  created_at: string;
};

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Invite partner state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteCompany, setInviteCompany] = useState<Company | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteRole, setInviteRole] = useState("company_admin");
  const [inviting, setInviting] = useState(false);

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: { name: "", phone: "", email: "", service_area: "", website: "", notes: "" },
  });

  async function fetchCompanies() {
    setLoading(true);
    const { data } = await supabase.from("companies").select("*").order("created_at", { ascending: false });
    setCompanies((data as Company[]) || []);
    setLoading(false);
  }

  useEffect(() => { fetchCompanies(); }, []);

  function openEdit(company: Company) {
    setEditing(company);
    form.reset({
      name: company.name,
      phone: company.phone || "",
      email: company.email || "",
      service_area: company.service_area?.join(", ") || "",
      website: company.website || "",
      notes: company.notes || "",
    });
    setDialogOpen(true);
  }

  function openNew() {
    setEditing(null);
    form.reset({ name: "", phone: "", email: "", service_area: "", website: "", notes: "" });
    setDialogOpen(true);
  }

  async function onSubmit(values: CompanyFormValues) {
    setSaving(true);
    const payload = {
      name: values.name,
      phone: values.phone || null,
      email: values.email || null,
      service_area: values.service_area ? values.service_area.split(",").map(s => s.trim()).filter(Boolean) : [],
      website: values.website || null,
      notes: values.notes || null,
    };

    if (editing) {
      const { error } = await supabase.from("companies").update(payload).eq("id", editing.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Updated" });
    } else {
      const { error } = await supabase.from("companies").insert(payload);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Company added" });
    }
    setSaving(false);
    setDialogOpen(false);
    fetchCompanies();
  }

  async function deleteCompany(id: string) {
    await supabase.from("companies").delete().eq("id", id);
    toast({ title: "Deleted" });
    fetchCompanies();
  }

  function openInvite(company: Company) {
    setInviteCompany(company);
    setInviteEmail("");
    setInvitePassword("");
    setInviteRole("company_admin");
    setInviteOpen(true);
  }

  async function handleInvite() {
    if (!inviteCompany || !inviteEmail || !invitePassword) return;
    setInviting(true);

    const { data, error } = await supabase.functions.invoke("invite-partner", {
      body: {
        email: inviteEmail,
        password: invitePassword,
        company_id: inviteCompany.id,
        company_role: inviteRole,
      },
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (data?.error) {
      toast({ title: "Error", description: data.error, variant: "destructive" });
    } else {
      toast({ title: "Partner invited", description: `Created account for ${inviteEmail} linked to ${inviteCompany.name}.` });
      setInviteOpen(false);
    }
    setInviting(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Vetted Companies</h1>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Add Company</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : companies.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No companies yet. Add your first vetted company.</p>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Service Area (ZIPs)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>
                    <div className="text-sm">{c.email}</div>
                    <div className="text-xs text-muted-foreground">{c.phone}</div>
                  </TableCell>
                  <TableCell className="text-sm">{c.service_area?.join(", ") || "—"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => openInvite(c)}>
                      <UserPlus className="h-3.5 w-3.5 mr-1" /> Invite Partner
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {c.name}?</AlertDialogTitle>
                          <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteCompany(c.id)}>Delete</AlertDialogAction>
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

      {/* Company form dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Company" : "Add Company"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="service_area" render={({ field }) => (
                <FormItem><FormLabel>Service Area (comma-separated ZIPs)</FormLabel><FormControl><Input placeholder="12345, 12346" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="website" render={({ field }) => (
                <FormItem><FormLabel>Website</FormLabel><FormControl><Input placeholder="https://" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editing ? "Update" : "Add"} Company
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Invite partner dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Partner — {inviteCompany?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Create a login account for this company. They'll access the partner dashboard at <code className="text-xs bg-muted px-1 py-0.5 rounded">/partner/login</code>.
            </p>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="partner@company.com" />
            </div>
            <div className="space-y-2">
              <Label>Temporary Password</Label>
              <Input type="text" value={invitePassword} onChange={e => setInvitePassword(e.target.value)} placeholder="Set initial password" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="company_admin">Company Admin (can manage team)</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleInvite} disabled={!inviteEmail || !invitePassword || inviting} className="w-full">
              {inviting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Partner Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
