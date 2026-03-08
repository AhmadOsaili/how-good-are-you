import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePartnerAuth } from "@/hooks/usePartnerAuth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

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

const PARTNER_STATUSES = ["assigned", "contacted", "in_progress", "closed_won", "closed_lost"] as const;

const STATUS_COLORS: Record<string, string> = {
  new: "bg-accent text-accent-foreground",
  assigned: "bg-primary/80 text-primary-foreground",
  contacted: "bg-secondary text-secondary-foreground",
  in_progress: "bg-primary/60 text-primary-foreground",
  closed_won: "bg-primary text-primary-foreground",
  closed_lost: "bg-muted text-muted-foreground",
  closed: "bg-muted text-muted-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  assigned: "Assigned",
  contacted: "Contacted",
  in_progress: "In Progress",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

export default function PartnerDashboard() {
  const { partnerInfo } = usePartnerAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (partnerInfo?.companyId) fetchLeads();
  }, [partnerInfo?.companyId, filter]);

  async function fetchLeads() {
    setLoading(true);

    // Get lead IDs assigned to my company
    const { data: assignments } = await supabase
      .from("lead_assignments")
      .select("lead_id")
      .eq("company_id", partnerInfo!.companyId);

    const leadIds = assignments?.map(a => a.lead_id) || [];

    if (leadIds.length === 0) {
      setLeads([]);
      setLoading(false);
      return;
    }

    let query = supabase
      .from("leads")
      .select("*")
      .in("id", leadIds)
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter as any);
    }

    const { data } = await query;
    setLeads((data as Lead[]) || []);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("leads").update({ status: status as any }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    toast({ title: "Status updated" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">My Leads</h1>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {PARTNER_STATUSES.map(s => (
              <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : leads.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No leads assigned yet.</p>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>ZIP</TableHead>
                <TableHead>Roof Age</TableHead>
                <TableHead>Concerns</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
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
                  <TableCell className="text-sm">{lead.address}</TableCell>
                  <TableCell>{lead.zip_code}</TableCell>
                  <TableCell>{lead.roof_age}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{lead.concerns || "—"}</TableCell>
                  <TableCell>
                    <Select value={lead.status} onValueChange={v => updateStatus(lead.id, v)}>
                      <SelectTrigger className="h-7 w-32 text-xs">
                        <Badge className={`${STATUS_COLORS[lead.status] || "bg-muted text-muted-foreground"} text-xs`}>
                          {STATUS_LABELS[lead.status] || lead.status}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {PARTNER_STATUSES.map(s => (
                          <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(lead.created_at).toLocaleDateString()}
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
