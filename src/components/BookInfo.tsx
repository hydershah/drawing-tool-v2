/**
 * BookInfo Component
 * Displays book information popup in bottom-right corner
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getSiteContent } from '@/pages/AdminContentPage';

export function BookInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState(getSiteContent());

  // Listen for content updates
  useEffect(() => {
    const handleContentUpdate = () => {
      console.log('BookInfo received siteContentUpdated event');
      const newContent = getSiteContent();
      console.log('Loaded new content:', newContent);
      setContent(newContent);
    };

    window.addEventListener('siteContentUpdated', handleContentUpdate);
    return () => {
      window.removeEventListener('siteContentUpdated', handleContentUpdate);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      {/* Popup */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 w-64 bg-card border border-border rounded-lg p-4 shadow-xl">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div style={{ fontFamily: 'FK Grotesk Mono, monospace' }}>
            <h3 className="text-sm font-semibold mb-3">{content.bookTitle}</h3>

            <p className="text-xs text-muted-foreground mb-3">
              {content.bookDescription}
            </p>

            <div className="space-y-2">
              {content.amazonUrl && (
                <a
                  href={content.amazonUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-foreground hover:text-primary transition-colors underline"
                >
                  Amazon
                </a>
              )}

              {content.bookshopUrl && (
                <a
                  href={content.bookshopUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-foreground hover:text-primary transition-colors underline"
                >
                  Bookshop
                </a>
              )}

              {content.barnesNobleUrl && (
                <a
                  href={content.barnesNobleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-foreground hover:text-primary transition-colors underline"
                >
                  Barnes & Noble
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Book Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 shadow-lg"
        aria-label="Book information"
      >
        <svg className="w-6 h-6 md:w-10 md:h-10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 66.39 67.63" fill="currentColor">
          <path d="M54.84,49.36c-6.99-1.47-14.07-.41-21.64,3.23-6.3-2.69-13.34-3.75-21.52-3.25-.34.02-.6.31-.58.65.02.34.34.6.65.58,8.1-.51,15.04.56,21.22,3.26.08.03.16.05.25.05.09,0,.18-.02.27-.06,7.41-3.62,14.32-4.69,21.1-3.26.33.07.66-.14.73-.47.07-.33-.14-.66-.47-.73Z"/>
          <path d="M32.59,20.91c-5.95-3.25-12.17-4.67-20.07-4.56h-.59s-.87,28.56-.87,28.56l.67-.04c7.93-.5,14.76.53,20.85,3.11v-27.07Z"/>
          <path d="M54.48,16.36h-.59c-7.87-.13-14.11,1.3-20.07,4.55v27.07c6.09-2.58,12.91-3.61,20.85-3.11l.67.04-.87-28.55Z"/>
        </svg>
      </button>
    </div>
  );
}
