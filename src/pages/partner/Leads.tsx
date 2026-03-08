import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Phone, Mail, MapPin, Calendar } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type LeadStatus = Database["public"]["Enums"]["lead_status"];

interface AssignedLead {
  id: string;
  lead_id: string;
  assigned_at: string;
  lead: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    roof_age: string;
    concerns: string | null;
    status: LeadStatus;
    created_at: string;
  };
}

const PARTNER_STATUSES: { value: LeadStatus; label: string }[] = [
  { value: "contacted", label: "Contacted" },
  { value: "in_progress", label: "In Progress" },
  { value: "closed_won", label: "Closed Won" },
  { value: "closed_lost", label: "Closed Lost" },
];

const STATUS_COLORS: Record<LeadStatus, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  assigned: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  contacted: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  in_progress: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  closed_won: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  closed_lost: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export default function PartnerLeads() {
  const { user, isPartnerMember } = useAuth();
  const [assignments, setAssignments] = useState<AssignedLead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignments = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("lead_assignments")
      .select("id, lead_id, assigned_at, lead:leads(id, name, email, phone, address, zip_code, roof_age, concerns, status, created_at)")
      .order("assigned_at", { ascending: false });

    if (error) {
      toast.error("Failed to load leads");
      console.error(error);
    } else {
      setAssignments((data as unknown as AssignedLead[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAssignments();
  }, [user]);

  const updateStatus = async (leadId: string, newStatus: LeadStatus) => {
    const { error } = await supabase
      .from("leads")
      .update({ status: newStatus })
      .eq("id", leadId);

    if (error) {
      toast.error("Failed to update status");
      console.error(error);
    } else {
      toast.success("Status updated");
      setAssignments((prev) =>
        prev.map((a) =>
          a.lead_id === leadId
            ? { ...a, lead: { ...a.lead, status: newStatus } }
            : a
        )
      );
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Leads</h1>
        <p className="text-muted-foreground">
          View and manage leads assigned to your company.
        </p>
      </div>

      {assignments.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No leads assigned to you yet.</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Roof Age</TableHead>
                <TableHead>Concerns</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.lead.name}</TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <a href={`tel:${a.lead.phone}`} className="hover:underline">
                          {a.lead.phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <a href={`mailto:${a.lead.email}`} className="hover:underline">
                          {a.lead.email}
                        </a>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {a.lead.address}, {a.lead.zip_code}
                    </div>
                  </TableCell>
                  <TableCell>{a.lead.roof_age}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {a.lead.concerns || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(a.assigned_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {isPartnerMember ? (
                      <Badge
                        variant="secondary"
                        className={STATUS_COLORS[a.lead.status]}
                      >
                        {a.lead.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </Badge>
                    ) : (
                      <Select
                        value={a.lead.status}
                        onValueChange={(val) => updateStatus(a.lead.id, val as LeadStatus)}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue>
                            <Badge
                              variant="secondary"
                              className={STATUS_COLORS[a.lead.status]}
                            >
                              {a.lead.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {PARTNER_STATUSES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              <Badge
                                variant="secondary"
                                className={STATUS_COLORS[s.value]}
                              >
                                {s.label}
                              </Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
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
