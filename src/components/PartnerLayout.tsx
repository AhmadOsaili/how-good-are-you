import { usePartnerAuth } from "@/hooks/usePartnerAuth";
import { Navigate, Outlet } from "react-router-dom";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Building2, Users, UserPlus, LogOut, LayoutDashboard } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function PartnerLayout() {
  const { user, isPartner, isCompanyAdmin, partnerInfo, loading, signOut } = usePartnerAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Skeleton className="h-8 w-32" /></div>;
  if (!user || !isPartner) return <Navigate to="/partner/login" replace />;

  const NAV = [
    { to: "/partner/dashboard", label: "My Leads", icon: Users },
    ...(isCompanyAdmin ? [{ to: "/partner/team", label: "Team", icon: UserPlus }] : []),
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarHeader className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-sidebar-primary" />
              <div>
                <span className="font-display text-lg font-bold text-sidebar-foreground">RoofRight</span>
                <p className="text-xs text-sidebar-foreground/60 truncate max-w-[160px]">{partnerInfo?.companyName}</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {NAV.map(({ to, label, icon: Icon }) => (
                <SidebarMenuItem key={to}>
                  <SidebarMenuButton asChild>
                    <NavLink to={to} className={({ isActive }) => isActive ? "font-semibold" : ""}>
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4">
            <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/70" onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex-1">
          <header className="flex items-center gap-2 border-b px-4 h-14">
            <SidebarTrigger />
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Partner Dashboard</span>
          </header>
          <main className="p-4 md:p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
