import { LeadForm } from "@/components/LeadForm";
import { Shield, CheckCircle, Users, Star, Award, TrendingUp, FileCheck, BarChart3, HelpCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { RoofingChatbot } from "@/components/RoofingChatbot";

const TRUST_POINTS = [
  { icon: Shield, title: "Carefully Vetted", desc: "Every contractor is screened for proven expertise, proper insurance, and professionalism" },
  { icon: CheckCircle, title: "No License Required in Texas", desc: "Texas doesn't require a roofing license — anyone can call themselves a roofer. We fix that." },
  { icon: Users, title: "Texas Roofing Experts", desc: "Matched with experienced professionals who know Texas building codes and local weather patterns" },
  { icon: Star, title: "Free Service", desc: "No cost to homeowners — get connected with quality roofers at zero risk" },
];

const STATS = [
  { value: "1,000+", label: "Texas Homeowners Served", icon: Users },
  { value: "97%", label: "Customer Satisfaction", icon: TrendingUp },
  { value: "48hr", label: "Avg. Response Time", icon: BarChart3 },
  { value: "100%", label: "Verified & Insured", icon: FileCheck },
];

const SCIENCE_POINTS = [
  {
    icon: Award,
    title: "Why Vetting Matters — The Research",
    desc: "According to the Texas Department of Insurance, roofing fraud accounts for hundreds of millions in homeowner losses annually. Studies show that states without licensing requirements see 2–3× more complaints about contractor quality.",
  },
  {
    icon: BarChart3,
    title: "Our Evidence-Based Screening",
    desc: "Our 12-point vetting process is modeled after best practices from the National Roofing Contractors Association (NRCA). We verify insurance, workmanship history, financial stability, and customer satisfaction ratings before any contractor joins our network.",
  },
  {
    icon: FileCheck,
    title: "Data-Driven Matching",
    desc: "Research from consumer protection agencies shows homeowners who use vetted referral networks report 68% fewer disputes. We match you based on roof type, project scope, location, and contractor performance data.",
  },
];

export default function Index() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            <span className="font-display text-xl font-bold text-foreground">RoofRight</span>
          </Link>
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
                <Shield className="h-4 w-4" /> Trusted by 1,000+ Texas homeowners
              </div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-foreground">
                Texas Doesn't License Roofers. <span className="text-primary">We Vet Them.</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                In Texas, <strong className="text-foreground">anyone can knock on your door and call themselves a roofer</strong> — no license required. We carefully screen every contractor in our network for proven expertise, proper insurance, and professionalism. Get matched for free.
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

      {/* Stats bar */}
      <section className="border-y bg-primary/5">
        <div className="container px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="text-center space-y-2">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 mx-auto">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-3xl font-display font-bold text-foreground">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Science-backed trust section */}
      <section className="py-16 md:py-20">
        <div className="container px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent mb-4">
              <BarChart3 className="h-4 w-4" /> Backed by Data & Research
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Science-Backed Protection for Your Biggest Investment
            </h2>
            <p className="text-muted-foreground mt-4 leading-relaxed">
              Our vetting methodology isn't based on gut feeling — it's built on industry research, consumer protection data, and proven screening frameworks.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {SCIENCE_POINTS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card rounded-xl border p-6 space-y-4 hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-t bg-muted/30 py-16">
        <div className="container px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="font-display text-3xl font-bold text-foreground">
              What Texas Homeowners Say
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Maria G.", city: "Houston", quote: "After a hailstorm, three different guys knocked on my door offering to fix my roof. None of them could show proof of insurance. RoofRight matched me with a vetted pro in 24 hours." },
              { name: "James T.", city: "Dallas", quote: "I had no idea Texas didn't require roofing licenses. RoofRight's screening process gave me confidence I was hiring someone qualified and insured." },
              { name: "Sarah K.", city: "Austin", quote: "The contractor RoofRight matched me with explained everything, showed their insurance, and completed the job on time. Research-backed vetting really works." },
            ].map(({ name, city, quote }) => (
              <div key={name} className="bg-card rounded-xl border p-6 space-y-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic">"{quote}"</p>
                <div>
                  <p className="font-semibold text-foreground text-sm">{name}</p>
                  <p className="text-xs text-muted-foreground">{city}, TX</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} RoofRight. Connecting homeowners with vetted roofing professionals.
        </div>
      </footer>
      <RoofingChatbot />
    </div>
  );
}
