/**
 * HomePage
 * Landing page with animated prompt submission form
 */

import { useEffect } from 'react';
import { PromptSubmission } from '@/components/prompt/PromptSubmission';

export function HomePage() {
  // Prevent body scroll on homepage
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="h-screen w-full overflow-hidden flex">
      <PromptSubmission />
    </div>
  );
}
