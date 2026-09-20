import { PageMeta } from "@/components/route-helpers";
import { Server, Globe, Database, Key, Boxes } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Checks() {
  const categories = [
    {
      title: "Infrastructure & Network",
      icon: Server,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      checks: [
        { name: "TLS / SSL", desc: "Verifies cipher strength, certificate validity, and HSTS enforcement." },
        { name: "DNS & Email", desc: "Checks for missing SPF and DMARC records that allow domain spoofing." },
        { name: "Open Ports", desc: "Scans common administrative and database ports that shouldn't be public." },
        { name: "Subdomain Enumeration", desc: "Discovers forgotten staging, dev, and admin environments." }
      ]
    },
    {
      title: "Application Security",
      icon: Globe,
      color: "text-primary",
      bg: "bg-primary/10",
      checks: [
        { name: "Security Headers", desc: "Checks for CSP, X-Frame-Options, and other essential HTTP headers." },
        { name: "Known CVEs", desc: "Fingerprints your stack and checks against vulnerability intelligence sources such as OSV." },
        { name: "Exposed Files", desc: "Probes for .env, .git, and common backup files left on the server." },
        { name: "Error Verbosity", desc: "Triggers intentional errors to see if your app leaks stack traces." }
      ]
    },
    {
      title: "API & Data Layer",
      icon: Database,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      checks: [
        { name: "GraphQL Introspection", desc: "Verifies if your GraphQL schema is completely open to the public." },
        { name: "Exposed API Docs", desc: "Searches for Swagger/OpenAPI endpoints that detail your entire backend." },
        { name: "BaaS & Storage", desc: "Checks if cloud storage buckets (S3, R2) are open to public writes/reads." },
      ]
    },
    {
      title: "Identity & Access",
      icon: Key,
      color: "text-orange-400",
      bg: "bg-orange-400/10",
      checks: [
        { name: "JWT Inspection", desc: "Analyzes token payloads for sensitive data and verifies signing algorithms." },
        { name: "Supabase RLS", desc: "Detects databases that return rows because Row Level Security is disabled." },
        { name: "Service Role Keys", desc: "Scans client bundles for embedded high-privilege administrative keys." },
      ]
    },
    {
      title: "Framework Specific",
      icon: Boxes,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      checks: [
        { name: "Next.js Misconfigs", desc: "Checks for exposed source maps, debug pages, and RSC payload leaks." },
        { name: "AI-Builder Flaws", desc: "Targeted checks for Lovable, Bolt, and Cursor scaffolded defaults." },
      ]
    }
  ];

  return (
    <>
      <PageMeta title="Security Checks" description="Comprehensive catalog of vulnerabilities VibeScan detects." />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Security Checks Catalog</h1>
          <p className="text-xl text-muted-foreground">
            VibeScan runs a highly specific, curated suite of checks designed for modern web applications. We don't just blindly fuzz; we look for the exact mistakes modern builders make.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {categories.map((category, i) => (
            <div key={i} className="glass-panel p-8 rounded-3xl" data-testid={`section-category-${category.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", category.bg, category.color)}>
                  <category.icon className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold">{category.title}</h2>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                {category.checks.map((check, j) => (
                  <div key={j} className="flex flex-col gap-1.5" data-testid={`check-item-${check.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
                    <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
                        {check.name}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                        {check.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}