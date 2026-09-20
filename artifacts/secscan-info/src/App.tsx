import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

import { Layout } from '@/components/layout';
import { ScrollToTop } from '@/components/route-helpers';

// Pages
import Home from '@/pages/home';
import HowItWorks from '@/pages/how-it-works';
import Checks from '@/pages/checks';
import Pricing from '@/pages/pricing';
import FAQ from '@/pages/faq';
import Security from '@/pages/security';
import Contact from '@/pages/contact';

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <ScrollToTop />
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/how-it-works" component={HowItWorks} />
          <Route path="/checks" component={Checks} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/faq" component={FAQ} />
          <Route path="/security" component={Security} />
          <Route path="/contact" component={Contact} />
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </Layout>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;