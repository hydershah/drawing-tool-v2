/**
 * GalleryPage
 * Display approved artworks in a grid with search functionality
 * Implements infinite scroll for performance optimization
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatPromptNumber } from '@/utils/format';
import { Loader2, AlertCircle, Search, User, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// Number of artworks to load initially and per scroll
const ITEMS_PER_PAGE = 24;

function ArtworkCard({
  artwork,
  isAdmin,
  onDelete,
  isDeleting,
}: {
  artwork: any;
  isAdmin: boolean;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div className="relative group">
      <div className="relative mb-3">
        {!imageLoaded && !imageError && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-muted/10 rounded"
            style={{ aspectRatio: '500/700' }}
          >
            <Loader2 className="w-6 h-6 text-muted-foreground/40 animate-spin" />
          </div>
        )}

        {imageError ? (
          <div
            className="flex flex-col items-center justify-center bg-muted/10 rounded text-muted-foreground/60"
            style={{ aspectRatio: '500/700' }}
          >
            <AlertCircle className="w-8 h-8 mb-2" />
            <span className="text-sm">Failed to load image</span>
          </div>
        ) : (
          <img
            src={artwork.imageData}
            alt={`Artwork ${formatPromptNumber(artwork.promptNumber)}`}
            className={`w-full h-auto transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ aspectRatio: '500/700' }}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            loading="lazy"
            decoding="async"
          />
        )}

        {isAdmin && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              onClick={() => onDelete(artwork.id)}
              disabled={isDeleting}
              size="sm"
              variant="destructive"
              aria-label={`Delete artwork`}
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              )}
            </Button>
          </div>
        )}
      </div>

      {artwork.promptText && (
        <div
          className="text-muted-foreground text-xs mb-2 line-clamp-2"
          style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
          title={artwork.promptText}
        >
          {artwork.promptText}
        </div>
      )}

      {artwork.artistName && (
        <div
          className="flex items-center gap-2 text-muted-foreground mt-1"
          style={{ fontSize: '9pt', fontFamily: 'FK Grotesk Mono, monospace' }}
        >
          <User className="w-3 h-3" aria-hidden="true" />
          <span>{artwork.artistName}</span>
        </div>
      )}
    </div>
  );
}

export function GalleryPage() {
  const { artworks, isAdmin, deleteArtwork, isLoading } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Filter artworks based on search query
  const filteredArtworks = useMemo(() => {
    if (!searchQuery.trim()) {
      return artworks;
    }

    const lowerQuery = searchQuery.toLowerCase();
    return artworks.filter(
      (artwork) =>
        artwork.artistName?.toLowerCase().includes(lowerQuery) ||
        formatPromptNumber(artwork.promptNumber).toLowerCase().includes(lowerQuery)
    );
  }, [artworks, searchQuery]);

  // Only display a subset of artworks for performance
  const displayedArtworks = useMemo(() => {
    return filteredArtworks.slice(0, displayCount);
  }, [filteredArtworks, displayCount]);

  const hasMore = displayCount < filteredArtworks.length;

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

  const handleDelete = useCallback(
    async (artworkId: string) => {
      const confirmed = window.confirm('Are you sure you want to delete this artwork?');
      if (!confirmed) {
        return;
      }

      setDeletingId(artworkId);

      try {
        deleteArtwork(artworkId);
        toast.success('Artwork deleted successfully');
      } catch (error) {
        console.error('Error deleting artwork:', error);
        toast.error('Failed to delete artwork');
      } finally {
        setDeletingId(null);
      }
    },
    [deleteArtwork]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-muted-foreground animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm" style={{ fontFamily: 'FK Grotesk Mono, monospace' }}>
            Loading gallery...
          </p>
        </div>
      </div>
    );
  }

  if (artworks.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-muted-foreground text-center py-12">
          No artworks yet. Create your first drawing!
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="space-y-4">
          <div className="text-foreground" role="status" aria-live="polite">
            {filteredArtworks.length} {filteredArtworks.length === 1 ? 'artwork' : 'artworks'}
            {searchQuery && ` matching "${searchQuery}"`}
          </div>

          <div className="relative max-w-2xl w-full">
            <label htmlFor="gallery-search" className="sr-only">
              Search artworks
            </label>
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="gallery-search"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by prompt or artist..."
              className="bg-card border-border text-foreground placeholder:text-muted-foreground pl-11 rounded-[20px] text-base focus:border-primary focus:ring-ring"
              autoComplete="off"
              aria-label="Search artworks"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
        {filteredArtworks.length === 0 ? (
          <div className="text-muted-foreground text-center py-12">
            {searchQuery ? (
              <>
                No artworks match your search for "{searchQuery}".
                <button
                  onClick={clearSearch}
                  className="block mx-auto mt-3 text-muted-foreground hover:text-foreground underline"
                >
                  Clear search
                </button>
              </>
            ) : (
              'No artworks yet. Create your first drawing!'
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {displayedArtworks.map((artwork) => (
                <ArtworkCard
                  key={artwork.id}
                  artwork={artwork}
                  isAdmin={isAdmin}
                  onDelete={handleDelete}
                  isDeleting={deletingId === artwork.id}
                />
              ))}
            </div>

            {/* Infinite scroll trigger and loading indicator */}
            {hasMore && (
              <div ref={loadMoreRef} className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                <span className="ml-2 text-muted-foreground text-sm">Loading more artworks...</span>
              </div>
            )}

            {/* Summary of loaded items */}
            {!hasMore && filteredArtworks.length > ITEMS_PER_PAGE && (
              <div className="text-center text-muted-foreground text-sm py-4">
                Showing all {filteredArtworks.length} artworks
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
