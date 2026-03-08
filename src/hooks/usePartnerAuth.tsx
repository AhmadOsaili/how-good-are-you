import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface PartnerInfo {
  companyId: string;
  companyName: string;
  companyRole: string;
}

export function usePartnerAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isPartner, setIsPartner] = useState(false);
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState<PartnerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          // Check partner role
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", currentUser.id)
            .eq("role", "partner" as any)
            .maybeSingle();

          const hasPartnerRole = !!roleData;
          setIsPartner(hasPartnerRole);

          if (hasPartnerRole) {
            // Get company info
            const { data: companyUser } = await (supabase as any)
              .from("company_users")
              .select("company_id, company_role, companies(name)")
              .eq("user_id", currentUser.id)
              .maybeSingle();

            if (companyUser) {
              const cu = companyUser as any;
              setPartnerInfo({
                companyId: cu.company_id,
                companyName: cu.companies?.name || "Unknown",
                companyRole: cu.company_role,
              });
              setIsCompanyAdmin(cu.company_role === "company_admin");
            }
          }
        } else {
          setIsPartner(false);
          setIsCompanyAdmin(false);
          setPartnerInfo(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password });

  const signOut = () => supabase.auth.signOut();

  return { user, isPartner, isCompanyAdmin, partnerInfo, loading, signIn, signOut };
}
