/**
 * BookInfo Component
 * Displays book information popup in bottom-right corner
 */

import { useState, useEffect } from 'react';
import { BookOpen, X } from 'lucide-react';
import { getSiteContent } from '@/pages/AdminContentPage';

export function BookInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState(getSiteContent());

  // Listen for content updates
  useEffect(() => {
    const handleContentUpdate = () => {
      setContent(getSiteContent());
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
        <BookOpen className="w-5 h-5 md:w-8 md:w-8" />
      </button>
    </div>
  );
}
