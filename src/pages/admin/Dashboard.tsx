import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus } from "lucide-react";

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  zip_code: string;
  roof_age: string;
  concerns: string | null;
  status: string;
  created_at: string;
};

type Company = { id: string; name: string };

const STATUS_COLORS: Record<string, string> = {
  new: "bg-accent text-accent-foreground",
  assigned: "bg-primary/80 text-primary-foreground",
  contacted: "bg-secondary text-secondary-foreground",
  closed: "bg-muted text-muted-foreground",
};

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [assigningLead, setAssigningLead] = useState<Lead | null>(null);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [assigning, setAssigning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLeads();
    supabase.from("companies").select("id, name").then(({ data }) => setCompanies(data || []));
  }, []);

  async function fetchLeads() {
    setLoading(true);
    let query = supabase.from("leads").select("*").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter as "new" | "assigned" | "contacted" | "closed");
    const { data } = await query;
    setLeads((data as Lead[]) || []);
    setLoading(false);
  }

  useEffect(() => { fetchLeads(); }, [filter]);

  async function updateStatus(id: string, status: "new" | "assigned" | "contacted" | "closed") {
    await supabase.from("leads").update({ status }).eq("id", id);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  }

  async function assignCompany() {
    if (!assigningLead || !selectedCompany) return;
    setAssigning(true);
    const { error } = await supabase.from("lead_assignments").insert({
      lead_id: assigningLead.id,
      company_id: selectedCompany,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Assigned!", description: "Lead assigned to company successfully." });
      if (assigningLead.status === "new") updateStatus(assigningLead.id, "assigned");
    }
    setAssigning(false);
    setAssigningLead(null);
    setSelectedCompany("");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Leads</h1>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : leads.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No leads yet.</p>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>ZIP</TableHead>
                <TableHead>Roof Age</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map(lead => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>
                    <div className="text-sm">{lead.email}</div>
                    <div className="text-xs text-muted-foreground">{lead.phone}</div>
                  </TableCell>
                  <TableCell>{lead.zip_code}</TableCell>
                  <TableCell>{lead.roof_age}</TableCell>
                  <TableCell>
                    <Select value={lead.status} onValueChange={v => updateStatus(lead.id, v as "new" | "assigned" | "contacted" | "closed")}>
                      <SelectTrigger className="h-7 w-28 text-xs">
                        <Badge className={`${STATUS_COLORS[lead.status]} text-xs`}>{lead.status}</Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {["new", "assigned", "contacted", "closed"].map(s => (
                          <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => setAssigningLead(lead)}>
                          <UserPlus className="h-3.5 w-3.5 mr-1" /> Assign
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Assign Lead: {lead.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-2">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Address: {lead.address}</p>
                            <p className="text-sm text-muted-foreground">Concerns: {lead.concerns || "None"}</p>
                          </div>
                          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                            <SelectTrigger><SelectValue placeholder="Select a company" /></SelectTrigger>
                            <SelectContent>
                              {companies.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button onClick={assignCompany} disabled={!selectedCompany || assigning} className="w-full">
                            {assigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Assign Company
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
