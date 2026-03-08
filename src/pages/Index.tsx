import { LeadForm } from "@/components/LeadForm";
import { Shield, CheckCircle, Users, Star } from "lucide-react";
import { Link } from "react-router-dom";

const TRUST_POINTS = [
  { icon: Shield, title: "Fully Vetted", desc: "Every roofer passes background checks, license verification & insurance validation" },
  { icon: CheckCircle, title: "No Scams", desc: "We eliminate fraud — only honest, reputable contractors make our network" },
  { icon: Users, title: "Local Experts", desc: "Matched with trusted professionals who know your area's building codes" },
  { icon: Star, title: "Free Service", desc: "No cost to homeowners — get connected with quality roofers at zero risk" },
];

export default function Index() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            <span className="font-display text-xl font-bold text-foreground">RoofRight</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/partner/login" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              Partner Login
            </Link>
            <Link to="/admin/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="container relative px-4 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-6 pt-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Shield className="h-4 w-4" /> Trusted by 1,000+ homeowners
              </div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-foreground">
                Stop Roofing <span className="text-primary">Scams</span> Before They Start
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                The roofing industry is plagued by fraud and insurance scams. We connect you with <strong className="text-foreground">thoroughly vetted, honest roofing professionals</strong> in your area — for free.
              </p>

              {/* Trust grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                {TRUST_POINTS.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-3">
                    <div className="flex-shrink-0 mt-1 h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form card */}
            <div className="bg-card rounded-2xl border shadow-xl p-6 md:p-8">
              <div className="text-center mb-6">
                <h2 className="font-display text-2xl font-bold text-foreground">Get Your Free Assessment</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Tell us about your roof and we'll match you with vetted local pros
                </p>
              </div>
              <LeadForm />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} RoofRight. Protecting homeowners from roofing fraud.
        </div>
      </footer>
    </div>
  );
}
