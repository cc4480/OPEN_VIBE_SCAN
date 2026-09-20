import { useEffect } from 'react';
import { useLocation } from 'wouter';

export function ScrollToTop() {
  const [pathname] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export function PageMeta({ title, description }: { title: string; description: string }) {
  useEffect(() => {
    const fullTitle = title === 'Home'
      ? 'SecScan — Understand Your Website Security'
      : `${title} | SecScan`;
    document.title = fullTitle;

    const setMeta = (selector: string, content: string) => {
      document.querySelector(selector)?.setAttribute('content', content);
    };

    setMeta('meta[name="description"]', description);
    setMeta('meta[property="og:title"]', fullTitle);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[name="twitter:title"]', fullTitle);
    setMeta('meta[name="twitter:description"]', description);
  }, [title, description]);

  return null;
}