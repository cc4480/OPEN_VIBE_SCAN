import { Link } from "wouter";
import { motion } from "framer-motion";
import { 
  ArrowRight, ShieldCheck, Activity, Code2, Bot, 
  Terminal, Database, Lock, Globe, Server, UserPlus, 
  Briefcase, Rocket, AlertTriangle, CheckCircle2, ChevronRight 
} from "lucide-react";
import { PageMeta } from "@/components/route-helpers";
import { cn } from "@/lib/utils";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <>
      <PageMeta title="Home" description="SecScan - Public education and trust for VibeScan." />
      <div className="flex flex-col gap-24 lg:gap-32 pb-24 overflow-hidden">
        {/* Hero Section */}
        <section className="relative pt-12 pb-20 lg:pt-24 lg:pb-32 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
              alt="Cyber security background"
              className="w-full h-full object-cover opacity-30 mix-blend-screen"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/80 to-background" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="max-w-4xl mx-auto text-center flex flex-col items-center"
            >
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8" data-testid="hero-badge">
                <ShieldCheck className="w-4 h-4" />
                <span>Built for Modern Builders</span>
              </motion.div>

              <motion.h1 variants={itemVariants} className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                Understand your <br />
                <span className="text-gradient-primary">security posture</span>
              </motion.h1>

              <motion.p variants={itemVariants} className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed">
                SecScan is the knowledge base for VibeScan. Learn how our black-box engine analyzes modern web applications without agents, configurations, or false confidence.
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                <Link
                  href="/how-it-works"
                  className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground text-lg font-bold rounded-xl shadow-[0_0_30px_rgba(20,184,120,0.25)] hover:shadow-[0_0_40px_rgba(20,184,120,0.4)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
                  data-testid="link-hero-how-it-works"
                >
                  See How It Works <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/checks"
                  className="w-full sm:w-auto px-8 py-4 bg-secondary text-foreground text-lg font-semibold rounded-xl border border-white/5 hover:bg-secondary/80 transition-all duration-300 text-center"
                  data-testid="link-hero-checks"
                >
                  Explore Checks
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Feature Teasers */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="glass-card p-8 rounded-2xl flex flex-col h-full" 
                  data-testid="feature-card-zero-config"
                >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-primary/10 text-primary">
                        <Activity className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Zero Configuration</h3>
                    <p className="text-muted-foreground flex-1">VibeScan operates entirely externally. If an attacker can reach your site, we can scan it. No agents, no DNS changes, no massive onboarding.</p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="glass-card p-8 rounded-2xl flex flex-col h-full" 
                  data-testid="feature-card-modern-stack"
                >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-blue-400/10 text-blue-400">
                        <Code2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Modern Stack Aware</h3>
                    <p className="text-muted-foreground flex-1">Designed for the Next.js, Supabase, and AI-builder era. We look for exactly how these frameworks leak data when misconfigured.</p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="glass-card p-8 rounded-2xl flex flex-col h-full" 
                  data-testid="feature-card-ai-translated"
                >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-purple-400/10 text-purple-400">
                        <Bot className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">AI Translated</h3>
                    <p className="text-muted-foreground flex-1">Raw vulnerability data is practically useless. DeepSeek AI translates every finding into plain English severity and context-aware fixes.</p>
                </motion.div>
            </div>
        </section>

        {/* 4-Step Scan Flow */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-testid="section-scan-flow">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">The analysis pipeline</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A precise, four-stage approach to identifying real risk without overwhelming you with noise.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            
            {[
              { num: "01", title: "Reconnaissance", desc: "Maps your attack surface, identifying frameworks, CDNs, and active subdomains.", icon: Globe, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
              { num: "02", title: "Active Probing", desc: "Executes a suite of targeted requests against your specific tech stack.", icon: Server, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
              { num: "03", title: "Evidence Capture", desc: "Validates vulnerabilities by capturing undeniable HTTP request/response proof.", icon: Lock, color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" },
              { num: "04", title: "AI Synthesis", desc: "Translates raw technical findings into severity scores and remediation steps.", icon: Bot, color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" }
            ].map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative pt-8 md:pt-0"
                data-testid={`scan-flow-step-${i + 1}`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center mb-6 relative z-10 border backdrop-blur-xl shadow-lg", step.bg, step.border, step.color)}>
                    <step.icon className="w-8 h-8" />
                    <span className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-xs font-bold text-foreground">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Report Preview / Static Mockup */}
        <section className="bg-card/30 border-y border-white/5 py-24 overflow-hidden" data-testid="section-report-preview">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
              <div className="lg:col-span-2">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Security made readable.</h2>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  Traditional scanners output hundreds of pages of raw XML or confusing PDF grids. VibeScan generates an interactive, context-aware report that proves the vulnerability exists and shows you exactly how to fix it.
                </p>
                
                <ul className="space-y-4 mb-8">
                  {[
                    "Letter grades for instant posture reading",
                    "Undeniable HTTP request/response evidence",
                    "Confidence vs. Severity scoring",
                    "Framework-specific remediation code"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-foreground/90 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center gap-2 text-primary font-semibold hover:text-primary/80 transition-colors"
                  data-testid="link-preview-how-it-works"
                >
                  View full methodology <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="lg:col-span-3 relative">
                {/* Ambient glow behind mockup */}
                <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
                
                {/* Mockup UI Panel */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="glass-panel border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative z-10 flex flex-col"
                  data-testid="mockup-report-panel"
                >
                  {/* Mockup Header */}
                  <div className="bg-background/80 border-b border-border p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Target Application</h3>
                      <div className="flex items-center gap-2 text-foreground font-mono text-sm sm:text-base">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        production-app.example.com
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-secondary/50 px-4 py-2 rounded-lg border border-white/5">
                      <span className="text-sm text-muted-foreground">Overall Score</span>
                      <span className="text-2xl font-bold text-yellow-400">C-</span>
                    </div>
                  </div>
                  
                  {/* Mockup Issue Item */}
                  <div className="p-4 sm:p-6 bg-card/40 flex-1">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <h4 className="text-lg font-bold flex items-center gap-2 text-foreground">
                          <AlertTriangle className="w-5 h-5 text-orange-400" />
                          Exposed Environment Variables
                        </h4>
                        <div className="flex gap-2">
                          <span className="px-2.5 py-1 bg-red-400/10 text-red-400 border border-red-400/20 rounded text-xs font-bold uppercase">
                            High Severity
                          </span>
                          <span className="px-2.5 py-1 bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 rounded text-xs font-bold uppercase">
                            High Confidence
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        The scanner detected an exposed `.env` file at the root of the web directory. This file contains sensitive credentials that can be read by any unauthenticated user.
                      </p>

                      <div className="space-y-2 mt-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Evidence (HTTP GET)</span>
                        <div className="bg-background border border-border rounded-lg p-4 font-mono text-xs overflow-x-auto text-muted-foreground relative">
                          <div className="flex gap-2 absolute top-4 right-4">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                          </div>
                          <p className="text-foreground/70">GET /.env HTTP/2.0</p>
                          <p className="text-foreground/70">Host: production-app.example.com</p>
                          <br />
                          <p className="text-emerald-400">HTTP/2.0 200 OK</p>
                          <p className="text-emerald-400">Content-Type: text/plain</p>
                          <br />
                          <p className="text-red-300">DATABASE_URL=postgres://&lt;redacted&gt;@db.example.com:5432/main</p>
                          <p className="text-red-300">API_CREDENTIAL=&lt;redacted&gt;</p>
                        </div>
                      </div>

                      <div className="space-y-2 mt-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Remediation</span>
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm text-foreground/90 leading-relaxed">
                          Remove the `.env` file from your public web root immediately. If you are using a static site generator or Next.js, ensure environment files are excluded from the `public/` directory and build outputs. Rotate the exposed database and API keys as they are compromised.
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Coverage Highlights */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-testid="section-coverage">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for the modern stack</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Legacy scanners look for PHP injections. VibeScan looks for open GraphQL resolvers and Supabase RLS bypasses.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Supabase RLS", icon: Database },
              { label: "Next.js RSC Leaks", icon: Code2 },
              { label: "Exposed API Keys", icon: Lock },
              { label: "GraphQL Introspection", icon: Server },
              { label: "JWT Misconfiguration", icon: ShieldCheck },
              { label: "Missing CSP Headers", icon: Terminal },
              { label: "Open Cloud Storage", icon: Globe },
              { label: "AI-Builder Defaults", icon: Bot },
            ].map((check, i) => (
              <div 
                key={i} 
                className="glass-card p-4 rounded-xl flex flex-col items-center text-center gap-3 border border-white/5 hover:border-primary/30 transition-all duration-300 group"
                data-testid={`coverage-pill-${i}`}
              >
                <check.icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-sm font-semibold text-foreground/90 group-hover:text-foreground">{check.label}</span>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-10">
            <Link 
              href="/checks" 
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-sm font-semibold transition-all"
              data-testid="link-coverage-all-checks"
            >
              View the full checks catalog
            </Link>
          </div>
        </section>

        {/* Audience Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: UserPlus, title: "For Solo Builders", desc: "Ship fast without anxiety. Let VibeScan double-check your deployment before you launch on Product Hunt." },
              { icon: Briefcase, title: "For Agencies", desc: "Provide undeniable proof of security to your clients. Hand over a clean VibeScan report with every finished project." },
              { icon: Rocket, title: "For Startup Teams", desc: "Integrate continuous monitoring into your agile flow. Catch regressions and missing headers before they become breaches." }
            ].map((audience, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col gap-4 text-center items-center"
                data-testid={`audience-card-${i}`}
              >
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-2 shadow-inner">
                  <audience.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">{audience.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{audience.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-testid="section-closing-cta">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-panel p-10 md:p-16 rounded-[2rem] text-center border-primary/20 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground tracking-tight">
                Ready to find the gaps?
              </h2>
              <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
                No installations. No credit card required. Enter your URL and get a complete posture analysis in minutes.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="/vibescan/scan"
                  className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground text-lg font-bold rounded-xl shadow-[0_0_30px_rgba(20,184,120,0.3)] hover:shadow-[0_0_40px_rgba(20,184,120,0.5)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
                  data-testid="link-cta-launch-scanner"
                >
                  <ShieldCheck className="w-5 h-5" /> Launch Scanner
                </a>
                <Link
                  href="/how-it-works"
                  className="w-full sm:w-auto px-8 py-4 bg-secondary text-foreground text-lg font-semibold rounded-xl border border-white/5 hover:bg-secondary/80 transition-all duration-300 text-center flex items-center justify-center gap-2 group"
                  data-testid="link-cta-how-it-works"
                >
                  Read the docs <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </>
  );
}