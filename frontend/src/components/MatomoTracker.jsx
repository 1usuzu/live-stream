import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useMatomo } from '@datapunt/matomo-tracker-react';

const MatomoTracker = () => {
  const location = useLocation();
  const { trackPageView } = useMatomo();

  useEffect(() => {
    // Track page view mỗi khi đường dẫn (location) thay đổi
    trackPageView();
  }, [location, trackPageView]);

  return null;
};

export default MatomoTracker;