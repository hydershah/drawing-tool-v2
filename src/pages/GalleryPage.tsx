/**
 * GalleryPage
 * Display approved artworks in a grid with search and pagination
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatPromptNumber } from '@/utils/format';
import { Loader2, AlertCircle, Search, User, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_PER_PAGE = 50;
const PER_PAGE_OPTIONS = [25, 50, 100];

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
            src={artwork.image || artwork.imageUrl || artwork.imageData}
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

      <div
        className="text-foreground text-2xl mb-2 line-clamp-2 leading-snug"
        style={{ fontFamily: 'Delcan Mono, monospace' }}
        title={artwork.promptText || 'No prompt'}
      >
        {artwork.promptText || `Prompt ${formatPromptNumber(artwork.promptNumber)}`}
      </div>

      {artwork.artistName && (
        <div
          className="flex items-center gap-2 text-muted-foreground mt-1 uppercase tracking-widest"
          style={{ fontSize: '9pt', fontFamily: 'FK Grotesk Mono, monospace' }}
        >
          <User className="w-3 h-3" aria-hidden="true" />
          <span>{artwork.artistName}</span>
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

export function GalleryPage() {
  const { artworks, isAdmin, deleteArtwork, isLoading } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_PER_PAGE);
  const scrollRef = useRef<HTMLDivElement>(null);

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
        artwork.promptText?.toLowerCase().includes(lowerQuery) ||
        formatPromptNumber(artwork.promptNumber).toLowerCase().includes(lowerQuery)
    );
  }, [artworks, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredArtworks.length / itemsPerPage));

  // Paginated subset
  const displayedArtworks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredArtworks.slice(start, start + itemsPerPage);
  }, [filteredArtworks, currentPage, itemsPerPage]);

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

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <div ref={scrollRef} className="h-screen overflow-y-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="space-y-6">
        {/* Search Bar */}
        <div className="space-y-4">
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
                No artworks match your search for &quot;{searchQuery}&quot;.
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
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
          </>
        )}
        </div>
      </div>
    </div>
  );
}
