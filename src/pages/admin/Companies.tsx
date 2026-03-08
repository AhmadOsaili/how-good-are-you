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
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, UserPlus, Mail, KeyRound } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  // Partner invite state
  const [partnerDialogOpen, setPartnerDialogOpen] = useState(false);
  const [partnerCompany, setPartnerCompany] = useState<Company | null>(null);
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerPassword, setPartnerPassword] = useState("");
  const [partnerSaving, setPartnerSaving] = useState(false);

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

  function openPartnerDialog(company: Company) {
    setPartnerCompany(company);
    setPartnerEmail(company.email || "");
    setPartnerPassword("");
    setPartnerDialogOpen(true);
  }

  async function createPartner(method: "invite" | "credentials") {
    if (!partnerCompany || !partnerEmail) return;
    if (method === "credentials" && !partnerPassword) {
      toast({ title: "Password required", description: "Enter a temporary password for this partner.", variant: "destructive" });
      return;
    }

    setPartnerSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-partner", {
        body: {
          email: partnerEmail,
          password: method === "credentials" ? partnerPassword : undefined,
          company_id: partnerCompany.id,
          method,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: method === "invite" ? "Invite sent!" : "Partner created!",
        description: method === "invite"
          ? `An invitation email has been sent to ${partnerEmail}.`
          : `Account created for ${partnerEmail}. Share the credentials securely.`,
      });
      setPartnerDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to create partner", variant: "destructive" });
    } finally {
      setPartnerSaving(false);
    }
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
      if (error) {
        const msg = error.message?.includes("duplicate") || error.code === "23505"
          ? "A company with this email already exists."
          : "Something went wrong. Please try again.";
        toast({ title: "Error", description: msg, variant: "destructive" });
      } else toast({ title: "Updated" });
    } else {
      const { error } = await supabase.from("companies").insert(payload);
      if (error) {
        const msg = error.message?.includes("duplicate") || error.code === "23505"
          ? "A company with this email already exists."
          : "Something went wrong. Please try again.";
        toast({ title: "Error", description: msg, variant: "destructive" });
      } else toast({ title: "Company added" });
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
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="outline" onClick={() => openPartnerDialog(c)} title="Add partner user">
                      <UserPlus className="h-3.5 w-3.5" />
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

      {/* Partner creation dialog */}
      <Dialog open={partnerDialogOpen} onOpenChange={setPartnerDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Partner User — {partnerCompany?.name}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="invite" className="mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="invite" className="gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Invite via Email
              </TabsTrigger>
              <TabsTrigger value="credentials" className="gap-1.5">
                <KeyRound className="h-3.5 w-3.5" /> Create Credentials
              </TabsTrigger>
            </TabsList>

            <TabsContent value="invite" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Send an invitation email. The partner will set their own password.
              </p>
              <div className="space-y-2">
                <Label>Partner Email</Label>
                <Input
                  type="email"
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                  placeholder="partner@company.com"
                />
              </div>
              <Button
                className="w-full"
                disabled={partnerSaving || !partnerEmail}
                onClick={() => createPartner("invite")}
              >
                {partnerSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                Send Invitation
              </Button>
            </TabsContent>

            <TabsContent value="credentials" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Create an account with a temporary password. Share it securely with the partner.
              </p>
              <div className="space-y-2">
                <Label>Partner Email</Label>
                <Input
                  type="email"
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                  placeholder="partner@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Temporary Password</Label>
                <Input
                  type="text"
                  value={partnerPassword}
                  onChange={(e) => setPartnerPassword(e.target.value)}
                  placeholder="Min 6 characters"
                />
              </div>
              <Button
                className="w-full"
                disabled={partnerSaving || !partnerEmail || !partnerPassword}
                onClick={() => createPartner("credentials")}
              >
                {partnerSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                Create Account
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
