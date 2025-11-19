/**
 * PromptsPage
 * Browse all submitted prompts from the community
 * Implements infinite scroll for performance optimization
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Separator } from '@/components/ui/Separator';
import { Search, Loader2 } from 'lucide-react';
import { formatDate } from '@/utils/format';

// Number of prompts to load initially and per scroll
const ITEMS_PER_PAGE = 50;

function PromptItem({
  prompt,
  isLast,
  onDrawClick,
}: {
  prompt: any;
  isLast: boolean;
  onDrawClick: (prompt: any) => void;
}) {
  const formattedPromptNumber = prompt.promptNumber
    ? `#${String(prompt.promptNumber).padStart(5, '0')}`
    : '#00000';
  const formattedDate = formatDate(prompt.createdAt);

  return (
    <div>
      <div className="px-4 md:px-8 py-4 md:py-5 hover:bg-accent/10 transition-colors">
        {/* Mobile Layout (Stacked) */}
        <div className="flex md:hidden flex-col gap-3">
          {/* Prompt Number and Date Row */}
          <div className="flex items-center justify-between">
            <div
              className="text-muted-foreground text-[13px] tracking-wide font-medium"
              style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
            >
              {formattedPromptNumber}
            </div>
            <div
              className="text-muted-foreground text-[13px]"
              style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
            >
              {formattedDate}
            </div>
          </div>

          {/* Prompt Text */}
          <div
            className="text-foreground text-[18px] leading-relaxed tracking-wide font-medium"
            style={{ fontFamily: 'Delcan Mono, monospace' }}
          >
            {prompt.prompt}
          </div>

          {/* Status/Button */}
          <div className="flex items-center justify-center">
            {prompt.status === 'completed' ? (
              <div className="text-muted-foreground text-[13px] font-medium tracking-wider uppercase whitespace-nowrap" style={{ fontFamily: 'FK Grotesk Mono, monospace' }}>
                COMPLETED
              </div>
            ) : (
              <Button
                onClick={() => onDrawClick(prompt)}
                size="sm"
                className="transition-all duration-200 whitespace-nowrap text-[13px] h-9 px-4 w-full bg-[#996090] text-white hover:bg-[#996090]/90 tracking-wider uppercase border-2 border-white rounded-none"
                aria-label={`Draw: ${prompt.prompt}`}
                style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
              >
                DRAW THIS PROMPT
              </Button>
            )}
          </div>
        </div>

        {/* Desktop Layout (Horizontal) */}
        <div className="hidden md:flex items-baseline gap-8">
          {/* Left: Prompt Text */}
          <div className="flex-1 min-w-0">
            <div
              className="text-foreground text-[20px] leading-relaxed truncate tracking-wide font-medium"
              style={{ fontFamily: 'Delcan Mono, monospace' }}
              title={prompt.prompt}
            >
              {prompt.prompt}
            </div>
          </div>

          {/* Center: Prompt Number and Date */}
          <div className="flex items-baseline gap-12 flex-shrink-0">
            <div
              className="text-muted-foreground text-[13px] tracking-wide font-medium"
              style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
            >
              {formattedPromptNumber}
            </div>
            <div
              className="text-muted-foreground text-[13px]"
              style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
            >
              {formattedDate}
            </div>
          </div>

          {/* Right: Status Badge and Draw Button */}
          <div className="flex items-baseline gap-3 flex-shrink-0 justify-end" style={{ width: '320px' }}>
            {prompt.status === 'completed' ? (
              <div className="text-muted-foreground text-[13px] font-medium tracking-wider uppercase whitespace-nowrap" style={{ fontFamily: 'FK Grotesk Mono, monospace' }}>
                COMPLETED
              </div>
            ) : (
              <Button
                onClick={() => onDrawClick(prompt)}
                size="sm"
                className="transition-all duration-200 whitespace-nowrap text-[13px] h-9 px-5 flex-shrink-0 bg-[#996090] text-white hover:bg-[#996090]/90 tracking-wider uppercase border-2 border-white rounded-none"
                aria-label={`Draw: ${prompt.prompt}`}
                style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
              >
                DRAW THIS PROMPT
              </Button>
            )}
          </div>
        </div>
      </div>
      {!isLast && (
        <div className="px-4 md:px-8">
          <Separator className="bg-border h-[2px]" />
        </div>
      )}
    </div>
  );
}

export function PromptsPage() {
  const { prompts, isLoading } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleDrawClick = useCallback((prompt: any) => {
    // Navigate to user draw page with the prompt
    navigate('/user-draw', { state: { prompt } });
  }, [navigate]);

  // Filter prompts based on search query
  const filteredPrompts = useMemo(() => {
    if (!searchQuery.trim()) {
      return prompts;
    }

    const lowerQuery = searchQuery.toLowerCase();
    return prompts.filter((prompt) => prompt.prompt.toLowerCase().includes(lowerQuery));
  }, [prompts, searchQuery]);

  // Only display a subset of prompts for performance
  const displayedPrompts = useMemo(() => {
    return filteredPrompts.slice(0, displayCount);
  }, [filteredPrompts, displayCount]);

  const hasMore = displayCount < filteredPrompts.length;

  // Reset display count when search query changes
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [searchQuery]);

  // Infinite scroll using Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore) {
          setDisplayCount((prev) => prev + ITEMS_PER_PAGE);
        }
      },
      { rootMargin: '400px' } // Load more 400px before reaching the end
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-muted-foreground animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm" style={{ fontFamily: 'FK Grotesk Mono, monospace' }}>
            Loading prompts...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto">
      <div className="space-y-6 md:space-y-8 mt-16 md:mt-24 px-4 md:px-8">
        <div className="space-y-4 md:space-y-5">
        {/* Search Bar */}
        <div className="relative max-w-2xl w-full">
          <label htmlFor="prompt-search" className="sr-only">
            Search prompts
          </label>
          <Search
            className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            id="prompt-search"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search prompts..."
            className="bg-card border-border text-foreground placeholder:text-muted-foreground pl-10 md:pl-11 pr-10 md:pr-11 rounded-[24px] text-[13px] h-10 md:h-11 focus:border-primary focus:ring-ring shadow-sm transition-all"
            style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
            autoComplete="off"
            aria-label="Search prompts"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
              aria-label="Clear search"
              type="button"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {filteredPrompts.length === 0 ? (
        <div
          className="text-muted-foreground text-center py-16 text-[13px]"
          style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
        >
          {searchQuery ? (
            <>
              No prompts match your search for "{searchQuery}".
              <button
                onClick={clearSearch}
                className="block mx-auto mt-4 text-muted-foreground hover:text-foreground underline text-[13px]"
                type="button"
              >
                Clear search
              </button>
            </>
          ) : (
            'No prompts yet. Be the first to submit one!'
          )}
        </div>
      ) : (
        <div className="space-y-0">
          {searchQuery && (
            <div
              className="text-muted-foreground text-[13px] mb-4"
              style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
              role="status"
              aria-live="polite"
            >
              Found {filteredPrompts.length} {filteredPrompts.length === 1 ? 'prompt' : 'prompts'}
            </div>
          )}
          <div className="space-y-0" role="list">
            {displayedPrompts.map((prompt, index) => (
              <div key={prompt.id} role="listitem">
                <PromptItem
                  prompt={prompt}
                  isLast={index === displayedPrompts.length - 1}
                  onDrawClick={handleDrawClick}
                />
              </div>
            ))}
          </div>

          {/* Infinite scroll trigger and loading indicator */}
          {hasMore && (
            <div ref={loadMoreRef} className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
              <span className="ml-2 text-muted-foreground text-sm">Loading more prompts...</span>
            </div>
          )}

          {/* Summary of loaded items */}
          {!hasMore && filteredPrompts.length > ITEMS_PER_PAGE && (
            <div className="text-center text-muted-foreground text-sm py-4">
              Showing all {filteredPrompts.length} prompts
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
