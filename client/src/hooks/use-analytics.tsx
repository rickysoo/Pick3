import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { initGA, trackPageView } from '../lib/analytics';

export const useAnalytics = () => {
  const [location] = useLocation();
  const prevLocationRef = useRef<string>(location);
  
  useEffect(() => {
    // Initialize Google Analytics on first load
    initGA();
    trackPageView(location);
    prevLocationRef.current = location;
  }, []); // Run once on mount
  
  useEffect(() => {
    if (location !== prevLocationRef.current) {
      trackPageView(location);
      prevLocationRef.current = location;
    }
  }, [location]);
};