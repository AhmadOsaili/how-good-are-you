import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPartner, setIsPartner] = useState(false);
  const [isPartnerMember, setIsPartnerMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rolesChecked, setRolesChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkRoles = async (userId: string) => {
      setRolesChecked(false);
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      if (!mounted) return;
      const roles = data?.map((r) => r.role) ?? [];
      setIsAdmin(roles.includes("admin"));
      setIsPartner(roles.includes("partner"));
      setRolesChecked(true);
    };

    // Get initial session first
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await checkRoles(currentUser.id);
      } else {
        setRolesChecked(true);
      }
      if (mounted) setLoading(false);
    });

    // Then listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await checkRoles(currentUser.id);
        } else {
          setIsAdmin(false);
          setIsPartner(false);
          setRolesChecked(true);
        }
        if (mounted) setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password });

  const signOut = () => supabase.auth.signOut();

  return { user, isAdmin, isPartner, loading, rolesChecked, signIn, signOut };
}
