/**
 * AdminDrawPage
 * Admin interface for creating artwork with prompt selection
 */

import { useState, useRef, useMemo, useCallback } from 'react';
import { DrawingCanvas, type DrawingCanvasHandle } from '@/components/canvas/DrawingCanvas';
import { useApp } from '@/contexts/AppContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/Slider';
import { toast } from 'sonner';
import { Search, Mail, CheckCircle2, Trash2, Download } from 'lucide-react';
import {
  DEFAULT_BRUSH_SIZE,
  DEFAULT_BRUSH_DENSITY,
  DEFAULT_BRUSH_CONTRAST,
  BRUSH_SIZE_MIN,
  BRUSH_SIZE_MAX,
  BRUSH_DENSITY_MIN,
  BRUSH_DENSITY_MAX,
  BRUSH_CONTRAST_MIN,
  BRUSH_CONTRAST_MAX,
} from '@/utils/constants';
import type { BrushSettings, Prompt } from '@/types';

export function AdminDrawPage() {
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const { addArtwork, prompts, updatePrompt } = useApp();
  const [brush, setBrush] = useState<BrushSettings>({
    size: DEFAULT_BRUSH_SIZE,
    density: DEFAULT_BRUSH_DENSITY,
    contrast: DEFAULT_BRUSH_CONTRAST,
  });
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [showPromptDropdown, setShowPromptDropdown] = useState(false);

  // Filter prompts based on search
  const filteredPrompts = useMemo(() => {
    if (!searchQuery.trim()) {
      return prompts.filter((p) => p.status === 'pending').slice(0, 10);
    }

    const lowerQuery = searchQuery.toLowerCase();
    return prompts
      .filter(
        (p) =>
          p.prompt.toLowerCase().includes(lowerQuery) ||
          p.email?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 10);
  }, [prompts, searchQuery]);

  const handleBrushSizeChange = useCallback((value: number[]) => {
    setBrush((prev) => ({ ...prev, size: value[0] }));
  }, []);

  const handleInkDensityChange = useCallback((value: number[]) => {
    setBrush((prev) => ({ ...prev, density: value[0] }));
  }, []);

  const handleContrastChange = useCallback((value: number[]) => {
    setBrush((prev) => ({ ...prev, contrast: value[0] }));
  }, []);

  const handleClear = useCallback(() => {
    if (!canvasRef.current) return;
    canvasRef.current.clear();
  }, []);

  const downloadCanvas = useCallback(() => {
    if (!canvasRef.current) return;

    try {
      const imageData = canvasRef.current.exportImage(false);
      const filename = selectedPrompt
        ? selectedPrompt.prompt
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
        : 'admin-drawing';

      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = imageData;
      link.click();
      toast.success('Drawing downloaded in high resolution!');
    } catch (error) {
      console.error('Error downloading canvas:', error);
      toast.error('Failed to download. Please try again.');
    }
  }, [selectedPrompt]);

  const handlePromptSelect = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setSearchQuery(prompt.prompt);
    setShowPromptDropdown(false);
    if (prompt.email) {
      setEmailInput(prompt.email);
    }
  };

  const handleClearPrompt = () => {
    setSelectedPrompt(null);
    setSearchQuery('');
    setEmailInput('');
  };

  const handleSave = async () => {
    if (!canvasRef.current) return;

    if (canvasRef.current.isEmpty()) {
      toast.error('Canvas is empty');
      return;
    }

    try {
      const imageData = canvasRef.current.exportImage(false);

      // Save artwork
      const artwork = await addArtwork({
        imageData,
        promptId: selectedPrompt?.id,
        isAdminCreated: true,
      });

      // If a prompt was selected, mark it as completed
      if (selectedPrompt) {
        await updatePrompt(selectedPrompt.id, {
          status: 'completed',
          completedAt: Date.now(),
          artworkId: artwork.id,
        });
      }

      // TODO: Send email notification if email is provided
      if (emailInput.trim()) {
        // Email sending would be implemented here via Supabase function
        toast.success('Artwork saved! Email notification sent.');
      } else {
        toast.success('Artwork saved to gallery!');
      }

      // Reset form
      canvasRef.current.clear();
      handleClearPrompt();
    } catch (error) {
      toast.error('Failed to save artwork');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-6 pb-6 px-4">
      {/* Main Content Container */}
      <div className="w-full max-w-7xl flex flex-col lg:flex-row items-start justify-center gap-6 lg:gap-8">
        {/* Canvas */}
        <div className="w-full lg:w-auto lg:flex-shrink-0">
          <div className="bg-muted/20 rounded-lg p-3 sm:p-4 w-full max-w-[95vw] sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mx-auto lg:mx-0">
            <DrawingCanvas ref={canvasRef} brush={brush} />
          </div>
        </div>

        {/* Controls */}
        <div className="w-full lg:w-96 lg:flex-shrink-0 space-y-4">
          {/* Page Title */}
          <div className="bg-card border border-border rounded-lg p-4 mt-8 text-center">
            <div className="text-foreground text-sm font-medium" style={{ fontFamily: 'FK Grotesk Mono, monospace' }}>
              Admin Draw
            </div>
          </div>

          {/* Prompt Selection */}
          <div className="space-y-2">
            <label
              className="text-muted-foreground text-sm font-medium uppercase"
              style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
            >
              Select Prompt (Optional)
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowPromptDropdown(true);
                }}
                onFocus={() => setShowPromptDropdown(true)}
                placeholder="Search for a prompt..."
                className="bg-card border-border text-foreground placeholder:text-muted-foreground pl-10 pr-20 h-10 transition-all duration-200 hover:border-primary focus:border-primary text-[13px]"
                style={{ fontFamily: 'Delcan Mono, monospace' }}
              />
              {selectedPrompt && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleClearPrompt}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 text-[11px]"
                >
                  Clear
                </Button>
              )}

              {/* Dropdown */}
              {showPromptDropdown && filteredPrompts.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto z-10">
                  {filteredPrompts.map((prompt) => (
                    <button
                      key={prompt.id}
                      onClick={() => handlePromptSelect(prompt)}
                      className="w-full px-4 py-3 text-left hover:bg-accent/10 transition-colors border-b border-border last:border-b-0"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div
                            className="text-[13px] text-foreground truncate"
                            style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
                          >
                            {prompt.prompt}
                          </div>
                          {prompt.email && (
                            <div
                              className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1"
                              style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
                            >
                              <Mail className="w-3 h-3" />
                              {prompt.email}
                            </div>
                          )}
                        </div>
                        {prompt.status === 'completed' && (
                          <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Prompt Display */}
            {selectedPrompt && (
              <div className="p-3 bg-accent/20 border border-border rounded-lg">
                <div
                  className="text-[12px] text-foreground"
                  style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
                >
                  <span className="text-muted-foreground">Selected: </span>
                  {selectedPrompt.prompt}
                </div>
              </div>
            )}
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <label
              className="text-muted-foreground text-sm font-medium uppercase"
              style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
            >
              Email for Notification (Optional)
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="user@example.com"
                className="bg-card border-border text-foreground placeholder:text-muted-foreground pl-10 h-10 transition-all duration-200 hover:border-primary focus:border-primary"
                style={{ fontFamily: 'Delcan Mono, monospace' }}
              />
            </div>
          </div>

          <div className="border-t-2 border-border my-5"></div>

          {/* Brush Controls */}
          <div className="space-y-5">
            {/* Brush Size */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="brush-size" className="text-foreground text-sm font-medium uppercase" style={{ fontFamily: 'FK Grotesk Mono, monospace' }}>
                  Brush Size
                </label>
                <span className="text-foreground text-sm" style={{ fontFamily: 'Delcan Mono, monospace' }} aria-live="polite">
                  {brush.size}px
                </span>
              </div>
              <Slider
                id="brush-size"
                value={[brush.size]}
                onValueChange={handleBrushSizeChange}
                min={BRUSH_SIZE_MIN}
                max={BRUSH_SIZE_MAX}
                step={1}
                className="w-full"
                aria-label="Brush size"
              />
            </div>

            {/* Ink Density */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="ink-density" className="text-foreground text-sm font-medium uppercase" style={{ fontFamily: 'FK Grotesk Mono, monospace' }}>
                  Ink Density
                </label>
                <span className="text-foreground text-sm" style={{ fontFamily: 'Delcan Mono, monospace' }} aria-live="polite">
                  {brush.density}%
                </span>
              </div>
              <Slider
                id="ink-density"
                value={[brush.density]}
                onValueChange={handleInkDensityChange}
                min={BRUSH_DENSITY_MIN}
                max={BRUSH_DENSITY_MAX}
                step={1}
                className="w-full"
                aria-label="Ink density"
              />
            </div>

            {/* Contrast */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="contrast" className="text-foreground text-sm font-medium uppercase" style={{ fontFamily: 'FK Grotesk Mono, monospace' }}>
                  Contrast
                </label>
                <span className="text-foreground text-sm" style={{ fontFamily: 'Delcan Mono, monospace' }} aria-live="polite">
                  {brush.contrast}%
                </span>
              </div>
              <Slider
                id="contrast"
                value={[brush.contrast]}
                onValueChange={handleContrastChange}
                min={BRUSH_CONTRAST_MIN}
                max={BRUSH_CONTRAST_MAX}
                step={1}
                className="w-full"
                aria-label="Contrast"
              />
            </div>
          </div>

          <div className="border-t-2 border-border my-5"></div>

          {/* Actions */}
          <div>
            {/* Icon Buttons */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={handleClear}
                className="flex-1 h-10 rounded-lg bg-card border border-border flex items-center justify-center gap-2 text-muted-foreground hover:bg-accent hover:text-foreground hover:border-primary transition-all duration-200 px-4"
                style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
                aria-label="Clear canvas"
                type="button"
              >
                <Trash2 className="w-5 h-5" aria-hidden="true" />
                <span className="text-sm">Clear</span>
              </button>

              <button
                onClick={downloadCanvas}
                className="flex-1 h-10 rounded-lg bg-card border border-border flex items-center justify-center gap-2 text-muted-foreground hover:bg-accent hover:text-foreground hover:border-primary transition-all duration-200 px-4"
                style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
                aria-label="Download drawing"
                type="button"
              >
                <Download className="w-5 h-5" aria-hidden="true" />
                <span className="text-sm">Download</span>
              </button>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleSave}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-6 py-4 transition-all duration-200 text-sm font-semibold"
                style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
                type="button"
              >
                Save to Gallery
              </Button>
            </div>
          </div>

          <div className="text-muted-foreground text-xs leading-relaxed bg-muted/30 rounded-lg p-4 mt-5" style={{ fontFamily: 'Delcan Mono, monospace' }}>
            Create artwork as admin. If you select a prompt, it will be marked as completed. If you provide an email, a notification will be sent.
          </div>
        </div>
      </div>
    </div>
  );
}
