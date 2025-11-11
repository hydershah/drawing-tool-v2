/**
 * AdminApprovalsPage
 * Artwork approval workflow for admin
 */

import { useEffect, useState, useCallback, memo, useRef, useMemo } from 'react';
import { Loader2, Check, X, User, Calendar, AlertCircle, RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';
import type { Artwork } from '@/types';

interface ActionDialogState {
  isOpen: boolean;
  artworkId: string | null;
  action: 'approve' | 'reject' | null;
  artwork: Artwork | null;
}

// Lazy image component with intersection observer
const LazyArtworkImage = memo(({ imageData, prompt }: { imageData: string; prompt: string | undefined }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(true);
  }, []);

  return (
    <div className="relative aspect-[5/7] bg-muted/20">
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
        </div>
      )}
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
          <AlertCircle className="w-8 h-8 mb-2" />
          <span className="text-xs">Failed to load image</span>
        </div>
      ) : (
        <img
          ref={imgRef}
          src={isInView ? imageData : undefined}
          alt={prompt || 'Artwork'}
          className={`w-full h-full object-contain transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
});

LazyArtworkImage.displayName = 'LazyArtworkImage';

export function AdminApprovalsPage() {
  const { pendingArtworks, approveArtwork, rejectArtwork, prompts, updatePrompt } = useApp();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState<ActionDialogState>({
    isOpen: false,
    artworkId: null,
    action: null,
    artwork: null,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const openConfirmDialog = useCallback((artwork: Artwork, action: 'approve' | 'reject') => {
    setDialogState({
      isOpen: true,
      artworkId: artwork.id,
      action,
      artwork,
    });
  }, []);

  const closeDialog = useCallback(() => {
    setDialogState({
      isOpen: false,
      artworkId: null,
      action: null,
      artwork: null,
    });
  }, []);

  const handleApprove = useCallback(async (id: string) => {
    setProcessingId(id);
    closeDialog();

    try {
      const artwork = pendingArtworks.find(art => art.id === id);
      if (!artwork) throw new Error('Artwork not found');

      approveArtwork(id);

      // Mark associated prompt as completed
      if (artwork.promptId) {
        const prompt = prompts.find(p => p.id === artwork.promptId);
        if (prompt && prompt.status !== 'completed') {
          updatePrompt(artwork.promptId, {
            status: 'completed',
            completedAt: Date.now(),
            artworkId: id
          });
        }
      }

      toast.success('Artwork approved successfully!');
    } catch (err) {
      console.error('Error approving artwork:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to approve artwork';
      toast.error(errorMsg);
    } finally {
      setProcessingId(null);
    }
  }, [pendingArtworks, approveArtwork, prompts, updatePrompt, closeDialog]);

  const handleReject = useCallback(async (id: string) => {
    setProcessingId(id);
    closeDialog();

    try {
      rejectArtwork(id);
      toast.success('Artwork rejected');
    } catch (err) {
      console.error('Error rejecting artwork:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to reject artwork';
      toast.error(errorMsg);
    } finally {
      setProcessingId(null);
    }
  }, [rejectArtwork, closeDialog]);

  const confirmAction = useCallback(() => {
    if (!dialogState.artworkId || !dialogState.action) return;

    if (dialogState.action === 'approve') {
      handleApprove(dialogState.artworkId);
    } else {
      handleReject(dialogState.artworkId);
    }
  }, [dialogState, handleApprove, handleReject]);

  const formatDate = useMemo(() => {
    return (timestamp: number) => {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    toast.success('Artworks refreshed');
    setTimeout(() => setIsRefreshing(false), 500);
  }, []);

  const handleDownload = useCallback(async (artwork: Artwork) => {
    try {
      // Get prompt text for filename
      const prompt = prompts.find(p => p.id === artwork.promptId);
      const promptText = prompt?.prompt || 'artwork';

      // Sanitize filename
      const sanitizedPrompt = promptText
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase()
        .substring(0, 30);

      const link = document.createElement('a');
      link.href = artwork.imageData;
      link.download = `${sanitizedPrompt}_${artwork.id.substring(0, 8)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Download started');
    } catch (err) {
      console.error('Error downloading artwork:', err);
      toast.error('Failed to download artwork');
    }
  }, [prompts]);

  if (pendingArtworks.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-2xl font-medium mb-8" style={{ fontFamily: 'FK Grotesk Mono, monospace' }}>
          Artwork Approvals
        </h1>
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="text-muted-foreground text-center" style={{ fontFamily: 'FK Grotesk Mono, monospace' }}>
            No pending artworks to review.
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-12">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-medium" style={{ fontFamily: 'FK Grotesk Mono, monospace' }}>
              Artwork Approvals
            </h1>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="text-foreground text-sm" style={{ fontFamily: 'FK Grotesk Mono, monospace' }}>
            {pendingArtworks.length} artwork{pendingArtworks.length !== 1 ? 's' : ''} pending approval
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingArtworks.map((artwork) => {
              const prompt = prompts.find(p => p.id === artwork.promptId);
              return (
                <div
                  key={artwork.id}
                  className="bg-card border border-border rounded-lg overflow-hidden transition-all hover:border-primary"
                >
                  <LazyArtworkImage imageData={artwork.imageData} prompt={prompt?.prompt} />

                  <div className="p-4 space-y-3">
                    <div className="text-foreground text-sm line-clamp-2" title={prompt?.prompt} style={{ fontFamily: 'FK Grotesk Mono, monospace' }}>
                      {prompt?.prompt || 'No prompt'}
                    </div>

                    {artwork.artistName && (
                      <div className="flex items-center gap-2 text-muted-foreground text-xs" style={{ fontFamily: 'FK Grotesk Mono, monospace' }}>
                        <User className="w-3 h-3" aria-hidden="true" />
                        <span>{artwork.artistName}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-muted-foreground text-xs" style={{ fontFamily: 'FK Grotesk Mono, monospace' }}>
                      <Calendar className="w-3 h-3" aria-hidden="true" />
                      <span>{formatDate(artwork.createdAt)}</span>
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => openConfirmDialog(artwork, 'approve')}
                          disabled={processingId === artwork.id}
                          className="flex-1 bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
                          size="sm"
                          style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
                          aria-label={`Approve ${prompt?.prompt || 'artwork'}`}
                        >
                          {processingId === artwork.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => openConfirmDialog(artwork, 'reject')}
                          disabled={processingId === artwork.id}
                          variant="outline"
                          className="flex-1 bg-transparent text-red-400 border-red-400/20 hover:bg-red-400/10 disabled:opacity-50"
                          size="sm"
                          style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
                          aria-label={`Reject ${prompt?.prompt || 'artwork'}`}
                        >
                          {processingId === artwork.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <X className="w-4 h-4 mr-1" />
                              Reject
                            </>
                          )}
                        </Button>
                      </div>
                      <Button
                        onClick={() => handleDownload(artwork)}
                        variant="outline"
                        className="w-full"
                        size="sm"
                        style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
                        aria-label={`Download ${prompt?.prompt || 'artwork'}`}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {dialogState.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={closeDialog}
        >
          <div
            className="bg-card border border-border"
            style={{
              position: 'relative',
              zIndex: 9999,
              padding: '24px',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 10px 50px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-foreground text-xl font-bold mb-3" style={{ fontFamily: 'FK Grotesk Mono, monospace' }}>
              {dialogState.action === 'approve' ? 'Approve Artwork' : 'Reject Artwork'}
            </h2>
            <p className="text-foreground text-sm mb-4" style={{ fontFamily: 'FK Grotesk Mono, monospace' }}>
              {dialogState.action === 'approve'
                ? 'Are you sure you want to approve this artwork? It will be published to the gallery.'
                : 'Are you sure you want to reject this artwork? This action cannot be undone.'}
            </p>
            {dialogState.artwork && (
              <div className="bg-muted/30 rounded-lg p-3 mt-4" style={{ fontFamily: 'FK Grotesk Mono, monospace' }}>
                <div className="text-foreground text-sm mb-2">
                  <strong>Prompt:</strong> {prompts.find(p => p.id === dialogState.artwork?.promptId)?.prompt || 'N/A'}
                </div>
                {dialogState.artwork.artistName && (
                  <div className="text-foreground text-xs mb-1">
                    <strong>Artist:</strong> {dialogState.artwork.artistName}
                  </div>
                )}
                {dialogState.artwork.artistEmail && (
                  <div className="text-foreground text-xs">
                    <strong>Email:</strong> {dialogState.artwork.artistEmail}
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-3 justify-end mt-6">
              <Button
                onClick={closeDialog}
                variant="outline"
                style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmAction}
                style={{
                  backgroundColor: dialogState.action === 'approve' ? '#22c55e' : '#ef4444',
                  color: '#ffffff',
                  fontFamily: 'FK Grotesk Mono, monospace'
                }}
              >
                {dialogState.action === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
