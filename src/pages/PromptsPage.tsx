/**
 * PromptsPage
 * Browse all submitted prompts from the community
 * Classic pagination with per-page selector
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Separator } from '@/components/ui/Separator';
import { Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '@/utils/format';

const DEFAULT_PER_PAGE = 50;
const PER_PAGE_OPTIONS = [25, 50, 100];

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
              className="text-muted-foreground text-[13px] uppercase"
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
                className="transition-all duration-200 whitespace-nowrap text-[13px] h-7 px-3 w-full bg-[#996090] text-white hover:bg-[#996090]/90 tracking-wider uppercase font-medium border border-white rounded-none flex items-center justify-center text-center"
                aria-label={`Draw: ${prompt.prompt}`}
                style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
              >
                DRAW THIS PROMPT
              </Button>
            )}
          </div>
        </div>

        {/* Desktop Layout (Horizontal) */}
        <div className="hidden md:flex items-baseline gap-10 lg:gap-12">
          {/* Left: Prompt Text */}
          <div className="flex-1 min-w-0">
            <div
              className="text-foreground text-[22px] leading-relaxed truncate tracking-wide font-medium"
              style={{ fontFamily: 'Delcan Mono, monospace' }}
              title={prompt.prompt}
            >
              {prompt.prompt}
            </div>
          </div>

          {/* Center: Prompt Number and Date */}
          <div className="flex items-baseline gap-12 lg:gap-16 flex-shrink-0">
            <div
              className="text-muted-foreground text-[13px] tracking-wide font-medium"
              style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
            >
              {formattedPromptNumber}
            </div>
            <div
              className="text-muted-foreground text-[13px] uppercase"
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
                className="transition-all duration-200 whitespace-nowrap text-[13px] h-7 px-4 flex-shrink-0 bg-[#996090] text-white hover:bg-[#996090]/90 tracking-wider uppercase font-medium border border-white rounded-none flex items-center justify-center text-center"
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
        <div className="px-4 md:px-8 -mt-2.5">
          <Separator className="bg-white dark:bg-white h-[1px]" />
        </div>
      )}
    </div>
  );
}

function getPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [1];

  if (currentPage > 3) {
    pages.push('ellipsis');
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) {
    pages.push('ellipsis');
  }

  pages.push(totalPages);

  return pages;
}

export function PromptsPage() {
  const { prompts, isLoading } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_PER_PAGE);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleDrawClick = useCallback((prompt: any) => {
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

  const totalPages = Math.max(1, Math.ceil(filteredPrompts.length / itemsPerPage));

  // Paginated subset
  const displayedPrompts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPrompts.slice(start, start + itemsPerPage);
  }, [filteredPrompts, currentPage, itemsPerPage]);

  // Reset to page 1 when search or per-page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage]);

  // Scroll to top when page changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

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

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <div ref={scrollRef} className="h-screen overflow-y-auto">
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
              No prompts match your search for &quot;{searchQuery}&quot;.
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 px-4 md:px-8">
              {/* Per page selector */}
              <div
                className="flex items-center gap-2 text-muted-foreground"
                style={{ fontSize: '10pt', fontFamily: 'FK Grotesk Mono, monospace' }}
              >
                <span>Per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="bg-card border border-border rounded px-2 py-1 text-foreground"
                  aria-label="Items per page"
                >
                  {PER_PAGE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Page numbers */}
              <nav className="flex items-center gap-1" aria-label="Pagination">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded text-foreground disabled:text-muted-foreground/30 hover:bg-accent transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {pageNumbers.map((page, idx) =>
                  page === 'ellipsis' ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 text-muted-foreground"
                      style={{ fontSize: '10pt', fontFamily: 'FK Grotesk Mono, monospace' }}
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`min-w-[32px] h-8 rounded transition-colors ${
                        currentPage === page
                          ? 'bg-foreground text-background'
                          : 'text-foreground hover:bg-accent'
                      }`}
                      style={{ fontSize: '10pt', fontFamily: 'FK Grotesk Mono, monospace' }}
                      aria-label={`Page ${page}`}
                      aria-current={currentPage === page ? 'page' : undefined}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded text-foreground disabled:text-muted-foreground/30 hover:bg-accent transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </nav>

              {/* Page indicator */}
              <div
                className="text-muted-foreground"
                style={{ fontSize: '10pt', fontFamily: 'FK Grotesk Mono, monospace' }}
              >
                Page {currentPage} of {totalPages}
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
