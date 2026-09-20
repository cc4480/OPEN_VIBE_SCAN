import { PageMeta } from "@/components/route-helpers";
import { Mail, MessageSquare, Bug, HelpCircle } from "lucide-react";

export default function Contact() {
  const contactOptions = [
    {
      icon: MessageSquare,
      title: "General Support",
      desc: "Questions about your account, pricing, or how to use VibeScan.",
      email: "support@secscan.info",
      subject: "General Support Request"
    },
    {
      icon: Bug,
      title: "Report a Vulnerability",
      desc: "Found a security issue with VibeScan? Let us know securely.",
      email: "security@secscan.info",
      subject: "Vulnerability Report"
    },
    {
      icon: HelpCircle,
      title: "Technical Help",
      desc: "Need help interpreting a scan result or false positive?",
      email: "support@secscan.info",
      subject: "Technical Assistance Needed"
    }
  ];

  return (
    <>
      <PageMeta title="Contact Us" description="Get in touch with the VibeScan team." />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Get in touch</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Whether you have a question about a scan report, need help setting up monitoring, or want to report an issue — we're here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {contactOptions.map((option, i) => (
            <div key={i} className="glass-panel p-8 rounded-3xl flex flex-col h-full" data-testid={`contact-card-${option.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-6">
                <option.icon className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">{option.title}</h3>
              <p className="text-muted-foreground mb-8 flex-1">{option.desc}</p>
              
              <a
                href={`mailto:${option.email}?subject=${encodeURIComponent(option.subject)}`}
                className="w-full py-3 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground font-semibold rounded-xl text-center transition-all duration-300"
                data-testid={`link-mailto-${option.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                Email {option.title.split(' ')[0]}
              </a>
            </div>
          ))}
        </div>

        <div className="mt-16 glass-card p-10 rounded-3xl text-center max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Product Feedback</h2>
          <p className="text-muted-foreground mb-8">
            Have an idea for a new check, report improvement, or monitoring workflow? We’d like to hear it.
          </p>
          <a
            href="mailto:hello@secscan.info?subject=Product%20Feedback"
            className="inline-flex items-center gap-2 px-8 py-4 bg-foreground text-background font-bold rounded-xl hover:bg-foreground/90 transition-all"
            data-testid="link-mailto-enterprise"
          >
            Share Feedback
          </a>
        </div>
      </div>
    </>
  );
}