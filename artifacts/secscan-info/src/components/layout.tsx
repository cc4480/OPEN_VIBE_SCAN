import { Link, useLocation } from "wouter";
import { Shield, Menu, X, ExternalLink, Info, Activity, CircleDollarSign, HelpCircle, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/how-it-works", label: "How It Works", icon: Info },
    { href: "/checks", label: "Checks", icon: Activity },
    { href: "/pricing", label: "Pricing", icon: CircleDollarSign },
    { href: "/faq", label: "FAQ", icon: HelpCircle },
    { href: "/security", label: "Security", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-blue-500/5 blur-[100px]" />
      </div>

      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
          scrolled
            ? "bg-background/80 backdrop-blur-lg border-white/5 shadow-lg shadow-black/20 py-3"
            : "bg-transparent border-transparent py-5",
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group" data-testid="link-home-logo">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-700 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
                <span className="font-display font-bold text-xl tracking-tight text-foreground leading-none">
                SecScan
                </span>
                <span className="text-[10px] text-primary font-medium tracking-widest uppercase">by VibeScan</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-foreground flex items-center gap-1.5",
                  location === link.href ? "text-foreground" : "text-muted-foreground",
                )}
                data-testid={`link-nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {link.label}
              </Link>
            ))}

            <div className="w-px h-6 bg-border" />

            <a
              href="/vibescan/scan"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg shadow-[0_0_15px_rgba(20,184,120,0.3)] hover:shadow-[0_0_25px_rgba(20,184,120,0.5)] hover:-translate-y-0.5 transition-all duration-200"
              data-testid="link-launch-scanner-desktop"
            >
              <ExternalLink className="w-4 h-4" /> Launch Scanner
            </a>
          </nav>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-white/5 py-4 px-4 flex flex-col gap-3 shadow-2xl">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                    "px-4 py-2 font-medium rounded-lg flex items-center gap-2",
                    location === link.href ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary"
                )}
                data-testid={`link-mobile-nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <link.icon className="w-4 h-4" /> {link.label}
              </Link>
            ))}
            <div className="h-px bg-border mx-4 my-2" />
            <a
              href="/vibescan/scan"
              onClick={() => setMobileMenuOpen(false)}
              className="mx-4 px-4 py-3 bg-primary text-primary-foreground text-center font-semibold rounded-lg flex items-center justify-center gap-2"
              data-testid="link-launch-scanner-mobile"
            >
              <ExternalLink className="w-4 h-4" /> Launch Scanner
            </a>
          </div>
        )}
      </header>

      <main className="flex-1 pt-24 pb-12">
        {children}
      </main>

      <footer className="border-t border-white/5 py-12 mt-auto bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-1 flex flex-col gap-4">
                <Link href="/" className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                    <Shield className="w-5 h-5 text-foreground" />
                    <span className="font-display font-bold tracking-tight text-foreground">SecScan</span>
                </Link>
                <p className="text-sm text-muted-foreground">
                    Public education and trust for VibeScan.
                </p>
            </div>
            <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                    <li><Link href="/how-it-works" className="hover:text-foreground transition-colors">How It Works</Link></li>
                    <li><Link href="/checks" className="hover:text-foreground transition-colors">Security Checks</Link></li>
                    <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                </ul>
            </div>
            <div>
                <h4 className="font-semibold mb-4">Resources</h4>
                <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                    <li><Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
                    <li><Link href="/security" className="hover:text-foreground transition-colors">Security & Trust</Link></li>
                    <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
                </ul>
            </div>
            <div>
                <h4 className="font-semibold mb-4">Scanner</h4>
                <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                    <li><a href="/vibescan/scan" className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Launch Scanner</a></li>
                </ul>
            </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} VibeScan. All rights reserved.
            </p>
        </div>
      </footer>
    </div>
  );
}