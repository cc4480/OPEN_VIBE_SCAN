import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { PageMeta } from "@/components/route-helpers";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "Do I need to authorize you to scan my site?",
    a: "Yes — and we enforce it. Before a scan can run, you must prove you control the target by adding a DNS TXT record we give you (a _secscan-challenge record containing a unique token). Scans stay blocked until that record is detected, and the verification expires after 30 days. Only scan applications you own or have explicit permission to test."
  },
  {
    q: "Is the scan safe for production environments?",
    a: "VibeScan is designed around targeted, non-destructive checks rather than aggressive fuzzing or destructive exploitation. Any scanner creates network traffic, so use staging first when a production system is especially sensitive."
  },
  {
    q: "How long does a scan take?",
    a: "Timing varies with the selected scan, target responsiveness, TLS assessment, and reconnaissance work. Many scans finish within ten minutes, while larger or slower targets can take longer."
  },
  {
    q: "How do you handle false positives?",
    a: "Findings include supporting evidence and a confidence score where available. Some checks are definitive while others are heuristic, so the report separates confidence from severity and recommends manual verification when needed."
  },
  {
    q: "What is Severity vs Confidence?",
    a: "Severity indicates how bad the vulnerability is if exploited (e.g., CVSS score). Confidence indicates how sure we are that the vulnerability actually exists. A High Severity / Low Confidence issue might require manual verification."
  },
  {
    q: "Do you check for CVEs?",
    a: "Yes. We fingerprint detectable technologies and versions, query vulnerability intelligence such as OSV, and surface applicable CVE identifiers with links to authoritative reference pages."
  },
  {
    q: "Who can see my scan reports?",
    a: "Reports are private to the account that initiated the scan. We do not publish a public wall of shame or share your vulnerability data with third parties."
  },
  {
    q: "How does Continuous Monitoring work?",
    a: "Monitoring schedules follow-up scans automatically. Targets with high or critical findings are checked more frequently, while lower-risk targets use a weekly cadence. Optional webhooks can receive completion notifications."
  },
  {
    q: "What are the limitations of a black-box scanner?",
    a: "Because the scanner observes the public application from the outside, it cannot prove the absence of vulnerabilities, review private source code, or fully test business-logic flaws and authenticated-only workflows. It complements—not replaces—manual security review and penetration testing."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <>
      <PageMeta title="FAQ" description="Frequently asked questions about VibeScan." />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Frequently Asked Questions</h1>
          <p className="text-xl text-muted-foreground">
            Everything you need to know about how we scan, safety, and privacy.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            
            return (
              <div 
                key={index}
                className="glass-card rounded-2xl overflow-hidden border border-white/5 transition-colors duration-300"
                data-testid={`faq-item-${index}`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-lg pr-4">{faq.q}</span>
                  <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform duration-300 shrink-0", isOpen && "rotate-180")} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 text-muted-foreground leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}