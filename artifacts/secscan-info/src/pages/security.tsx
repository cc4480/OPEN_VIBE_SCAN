import { PageMeta } from "@/components/route-helpers";
import { ShieldCheck, Server, AlertTriangle, FileLock2 } from "lucide-react";

export default function Security() {
  return (
    <>
      <PageMeta title="Security & Trust" description="Our commitment to responsible security testing." />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Security & Trust</h1>
          <p className="text-xl text-muted-foreground">
            We build security tools. We hold ourselves to the highest standards of safety, privacy, and responsible disclosure.
          </p>
        </div>

        <div className="space-y-12">
          <section className="glass-panel p-8 md:p-10 rounded-3xl" data-testid="section-responsible-use">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-400" /> Responsible Use
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                VibeScan is a tool for builders, agencies, and security researchers to verify the posture of applications they own or are authorized to test.
              </p>
              <p>
                Only scan infrastructure you own or have explicit permission to test. SecScan is intended for defensive assessment—not unauthorized reconnaissance.
              </p>
            </div>
          </section>

          <section className="glass-panel p-8 md:p-10 rounded-3xl" data-testid="section-scanning-model">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Server className="w-6 h-6 text-blue-400" /> Non-Destructive Scanning Model
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                The engine is designed around targeted, bounded checks rather than destructive exploitation. Any external scanner still creates traffic, so use a staging environment first when a production system is especially sensitive.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>No fuzzing:</strong> We do not flood inputs with random data attempting to crash the server.</li>
                <li><strong>No destructive injection:</strong> We do not attempt to drop tables (e.g., DROP TABLE) or write to your database.</li>
                <li><strong>Bounded requests:</strong> Checks use request limits and timeouts to avoid open-ended crawling or aggressive load generation.</li>
              </ul>
            </div>
          </section>

          <section className="glass-panel p-8 md:p-10 rounded-3xl" data-testid="section-data-handling">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <FileLock2 className="w-6 h-6 text-primary" /> Data Handling & Privacy
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Scan targets, findings, and reports are stored so the initiating account can review results and compare future scans. Reports remain account-scoped unless the account owner creates a public share link.
              </p>
              <p>
                Findings may be sent to the configured AI analysis provider to produce plain-English summaries and remediation guidance. Avoid scanning systems when you are not authorized to submit their public response data for analysis.
              </p>
            </div>
          </section>

          <section className="glass-panel p-8 md:p-10 rounded-3xl" data-testid="section-vulnerability-disclosure">
            <h2 className="text-2xl font-bold mb-4">Vulnerability Disclosure</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                If you believe you have found a security vulnerability in VibeScan itself, please contact us immediately. We ask that you do not disclose it publicly until we have had a chance to patch it.
              </p>
              <p>
                Send reports directly to <a className="text-primary hover:underline" href="mailto:security@secscan.info">security@secscan.info</a> with clear reproduction steps and potential impact. Please allow time for investigation before publishing details.
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}