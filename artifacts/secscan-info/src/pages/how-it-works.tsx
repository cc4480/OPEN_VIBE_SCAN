import { motion } from "framer-motion";
import { Search, Loader2, FileSearch, ShieldAlert, RotateCw } from "lucide-react";
import { PageMeta } from "@/components/route-helpers";

export default function HowItWorks() {
  const steps = [
    {
      icon: Search,
      title: "1. Prove Ownership",
      desc: "Before anything is scanned, you prove you control the target: we give you a unique token to publish as a DNS TXT record (_secscan-challenge) on the domain. The scan stays blocked until the record is detected.",
      details: ["DNS TXT challenge per domain", "Verification valid for 30 days", "No scan without proof of control"]
    },
    {
      icon: Loader2,
      title: "2. The Target Phase",
      desc: "Provide any public URL. VibeScan resolves the host, checks routing, and identifies the core technology stack to tailor the scan payload.",
      details: ["Fingerprints frameworks (Next.js, React, etc.)", "Detects CDNs (Cloudflare, Vercel)", "Maps baseline architecture"]
    },
    {
      icon: Loader2,
      title: "3. Active Scanning",
      desc: "The engine runs a full OWASP coverage suite, actively probing for common mistakes in modern web applications without brute-forcing.",
      details: ["Evaluates SSL/TLS and DNS records", "Probes for exposed files (.env, .git)", "Checks HTTP security headers"]
    },
    {
      icon: FileSearch,
      title: "4. Evidence Collection",
      desc: "Every vulnerability found is backed by hard evidence. We capture the exact request and response headers so you aren't chasing ghosts.",
      details: ["No black-box mystery", "Direct proof of exposure", "Reduced false positives"]
    },
    {
      icon: ShieldAlert,
      title: "5. AI Synthesis & Prioritization",
      desc: "Raw CVSS scores are confusing. DeepSeek AI reads the evidence and provides a contextual severity score alongside plain-English fix instructions. Evidence is scrubbed of secrets first, and you can opt out of AI analysis per scan.",
      details: ["Clear, actionable language", "Framework-specific fix steps", "Severity vs Confidence ratings"]
    },
    {
      icon: RotateCw,
      title: "6. Fix & Rescan",
      desc: "Security is iterative. Apply the fix and run a differential scan to verify the vulnerability is closed in production.",
      details: ["Instant validation", "Continuous monitoring available", "Historical posture tracking"]
    }
  ];

  return (
    <>
      <PageMeta title="How It Works" description="Learn how VibeScan analyzes your application from start to finish." />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">How It Works</h1>
          <p className="text-xl text-muted-foreground">
            A transparent look into how VibeScan approaches web security.
          </p>
        </div>

        <div className="space-y-12 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
              data-testid={`step-${index + 1}`}
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-background bg-card shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <step.icon className="w-5 h-5" />
              </div>
              
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] glass-card p-6 md:p-8 rounded-2xl group-hover:border-primary/30 transition-colors">
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">{step.desc}</p>
                <ul className="space-y-2">
                  {step.details.map((detail, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-foreground/80">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}