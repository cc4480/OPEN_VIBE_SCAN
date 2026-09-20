import { Link } from "wouter";
import { PageMeta } from "@/components/route-helpers";
import { ShieldAlert, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <PageMeta title="Page Not Found" description="The requested page could not be found." />
      
      <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
        <ShieldAlert className="w-10 h-10 text-destructive" />
      </div>
      
      <h1 className="text-4xl font-bold mb-4">404 - Not Found</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        The page you're looking for doesn't exist or has been moved. 
        If you typed the URL manually, double-check the spelling.
      </p>
      
      <Link 
        href="/"
        className="flex items-center gap-2 px-6 py-3 bg-secondary text-foreground font-semibold rounded-lg hover:bg-secondary/80 transition-all"
        data-testid="link-404-home"
      >
        <Home className="w-4 h-4" /> Return Home
      </Link>
    </div>
  );
}