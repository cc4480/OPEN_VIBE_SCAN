import { PageMeta } from "@/components/route-helpers";
import { CheckCircle2, Search, Bot, Bell, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Pricing() {
  return (
    <>
      <PageMeta title="Pricing" description="VibeScan pricing and plans." />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6 uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" /> Free Early Access
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Security for everyone</h1>
          <p className="text-xl text-muted-foreground">
            We're currently in early access. All scans and continuous monitoring are completely free while we fine-tune our analysis engine.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {[
            {
              icon: Search,
              title: "Basic Scan",
              desc: "Core OWASP checks in minutes.",
              features: ["Security headers audit", "SSL/TLS grading", "Tech fingerprinting", "Letter grade A–F"],
              cta: "Run Basic Scan",
              href: "/vibescan/scan",
              color: "text-foreground",
              bg: "bg-secondary",
              border: "",
            },
            {
              icon: Bot,
              title: "Deep Scan",
              desc: "Full analysis + AI remediation guide.",
              features: ["Everything in Basic", "Active path probing", "DNS & email security", "DeepSeek AI analysis", "Step-by-step fix guides"],
              cta: "Run Deep Scan",
              href: "/vibescan/scan",
              color: "text-primary",
              bg: "bg-primary/10",
              border: "border-primary/50 shadow-[0_0_30px_rgba(20,184,120,0.1)]",
              popular: true,
            },
            {
              icon: Bell,
              title: "Continuous Monitor",
              desc: "Automated rescans + CVE alerts.",
              features: ["Weekly deep rescans", "Daily CVE feed monitoring", "Instant alerts for your stack", "Full AI report every run"],
              cta: "Start Monitoring",
              href: "/vibescan/monitor",
              color: "text-indigo-400",
              bg: "bg-indigo-400/10",
              border: "border-indigo-500/30",
            },
          ].map((item, i) => (
            <div key={i} className={cn("glass-panel p-8 rounded-3xl flex flex-col relative", item.border)} data-testid={`pricing-card-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
              {item.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                  Most Popular
                </div>
              )}
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6", item.bg, item.color)}>
                <item.icon className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
              <p className="text-muted-foreground pb-6 border-b border-white/10 mb-6">{item.desc}</p>
              
              <div className="mb-8">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground ml-2">/ month</span>
              </div>

              <ul className="flex flex-col gap-3.5 mb-10 flex-1">
                {item.features.map((feat, j) => (
                  <li key={j} className="flex items-start gap-3 text-foreground/90">
                    <CheckCircle2 className={cn("w-5 h-5 shrink-0 mt-0.5", item.popular ? "text-primary" : "text-muted-foreground")} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              
              <a
                href={item.href}
                className={cn(
                  "w-full py-4 rounded-xl font-bold transition-all text-center block text-lg",
                  item.popular
                    ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(20,184,120,0.3)] hover:shadow-[0_0_30px_rgba(20,184,120,0.5)] hover:-translate-y-1"
                    : item.title === "Continuous Monitor"
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30"
                    : "bg-secondary text-foreground hover:bg-white/10 border border-white/5",
                )}
                data-testid={`link-pricing-cta-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {item.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}