/**
 * PromptsPage
 * Browse all submitted prompts from the community
 */

import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Separator } from '@/components/ui/Separator';
import { Search, CheckCircle2, Paintbrush } from 'lucide-react';
import { formatDate } from '@/utils/format';

function PromptItem({
  prompt,
  isLast,
  onDrawClick,
}: {
  prompt: any;
  isLast: boolean;
  onDrawClick: (prompt: any) => void;
}) {
  const formattedPromptNumber = `#${String(prompt.id).padStart(5, '0')}`;
  const formattedDate = formatDate(prompt.createdAt);

  return (
    <div>
      <div className="px-8 py-5 hover:bg-accent/10 transition-colors">
        <div className="flex items-center gap-8">
          {/* Left: Prompt Text and Date */}
          <div className="flex-1 min-w-0 py-2">
            <div
              className="text-foreground text-[15px] leading-relaxed truncate mb-1.5"
              style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
              title={prompt.prompt}
            >
              {prompt.prompt}
            </div>
            <div
              className="text-muted-foreground text-[11px]"
              style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
            >
              {formattedDate}
            </div>
          </div>

          {/* Center: Prompt Number */}
          <div
            className="text-muted-foreground text-[14px] tracking-wide font-medium text-center flex-shrink-0"
            style={{
              fontFamily: 'FK Grotesk Mono, monospace',
              width: '120px',
              marginRight: '20%',
            }}
          >
            {formattedPromptNumber}
          </div>

          {/* Right: Status Badge and Draw Button */}
          <div className="flex items-center gap-3 flex-shrink-0 justify-end" style={{ width: '320px' }}>
            {prompt.status === 'completed' && (
              <div className="px-3 py-1.5 bg-green-500/15 text-green-400 rounded-md text-[11px] font-medium tracking-wide flex items-center gap-1.5 whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Completed</span>
              </div>
            )}
            <Button
              onClick={() => onDrawClick(prompt)}
              size="sm"
              variant="outline"
              className="transition-all duration-200 whitespace-nowrap text-[13px] h-9 px-4 flex-shrink-0"
              aria-label={`Draw: ${prompt.prompt}`}
            >
              <Paintbrush className="w-4 h-4 mr-2" aria-hidden="true" />
              Draw this prompt
            </Button>
          </div>
        </div>
      </div>
      {!isLast && (
        <div className="px-8">
          <Separator className="bg-border" />
        </div>
      )}
    </div>
  );
}

export function PromptsPage() {
  const { prompts } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <div className="space-y-8 mt-24 px-8">
      <div className="space-y-5">
        {/* Header Title */}
        <h1
          className="text-foreground text-[15px] tracking-tight"
          style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
          role="status"
          aria-live="polite"
        >
          Browse {prompts.length} creative {prompts.length === 1 ? 'prompt' : 'prompts'} from our community
        </h1>

        {/* Search Bar */}
        <div className="relative max-w-2xl w-full mx-auto">
          <label htmlFor="prompt-search" className="sr-only">
            Search prompts
          </label>
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            id="prompt-search"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search prompts..."
            className="bg-card border-border text-foreground placeholder:text-muted-foreground pl-11 pr-11 rounded-[24px] text-[14px] h-11 focus:border-primary focus:ring-ring shadow-sm transition-all"
            style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
            autoComplete="off"
            aria-label="Search prompts"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
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
          className="text-muted-foreground text-center py-16 text-[14px]"
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
            {filteredPrompts.map((prompt, index) => (
              <div key={prompt.id} role="listitem">
                <PromptItem
                  prompt={prompt}
                  isLast={index === filteredPrompts.length - 1}
                  onDrawClick={handleDrawClick}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
