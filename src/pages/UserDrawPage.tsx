/**
 * UserDrawPage
 * User interface for drawing a selected prompt
 */

import { useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DrawingCanvas, type DrawingCanvasHandle } from '@/components/canvas/DrawingCanvas';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/Slider';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';
import { Send, Loader2, Trash2, Download } from 'lucide-react';
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
import type { BrushSettings } from '@/types';

export function UserDrawPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addArtwork } = useApp();
  const canvasRef = useRef<DrawingCanvasHandle>(null);

  // Get prompt from navigation state
  const prompt = location.state?.prompt;

  const [brush, setBrush] = useState<BrushSettings>({
    size: DEFAULT_BRUSH_SIZE,
    density: DEFAULT_BRUSH_DENSITY,
    contrast: DEFAULT_BRUSH_CONTRAST,
  });

  const [artistName, setArtistName] = useState('');
  const [artistEmail, setArtistEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  // If no prompt, redirect back
  if (!prompt) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No prompt selected</p>
          <Button onClick={() => navigate('/prompts')}>
            Browse Prompts
          </Button>
        </div>
      </div>
    );
  }

  const handleBrushSizeChange = useCallback((value: number[]) => {
    setBrush((prev) => ({ ...prev, size: value[0] }));
  }, []);

  const handleInkDensityChange = useCallback((value: number[]) => {
    setBrush((prev) => ({ ...prev, density: value[0] }));
  }, []);

  const handleContrastChange = useCallback((value: number[]) => {
    setBrush((prev) => ({ ...prev, contrast: value[0] }));
  }, []);

  const handleArtistNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setArtistName(value);
    if (nameError) {
      setNameError(null);
    }
  }, [nameError]);

  const handleArtistEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setArtistEmail(value);
    if (emailError) {
      setEmailError(null);
    }
  }, [emailError]);

  const clearCanvas = useCallback(() => {
    if (!canvasRef.current) return;

    const confirmed = hasDrawn
      ? window.confirm('Are you sure you want to clear your drawing?')
      : true;

    if (!confirmed) return;

    canvasRef.current.clear();
    setHasDrawn(false);
  }, [hasDrawn]);

  const downloadCanvas = useCallback(() => {
    if (!canvasRef.current) return;

    try {
      const imageData = canvasRef.current.exportImage(false);
      const filename = prompt.prompt
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'drawing';

      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = imageData;
      link.click();
      toast.success('Drawing downloaded in high resolution!');
    } catch (error) {
      console.error('Error downloading canvas:', error);
      toast.error('Failed to download. Please try again.');
    }
  }, [prompt]);

  const validateArtistName = useCallback((name: string): boolean => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setNameError('Please enter your name');
      return false;
    }

    if (trimmedName.length > 100) {
      setNameError('Name is too long (max 100 characters)');
      return false;
    }

    setNameError(null);
    return true;
  }, []);

  const validateArtistEmail = useCallback((email: string): boolean => {
    const trimmedEmail = email.trim();

    // Email is optional, so empty is valid
    if (!trimmedEmail) {
      setEmailError(null);
      return true;
    }

    if (trimmedEmail.length > 254) {
      setEmailError('Email address is too long');
      return false;
    }

    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address');
      return false;
    }

    setEmailError(null);
    return true;
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!canvasRef.current) return;

    if (!validateArtistName(artistName)) {
      return;
    }

    if (!validateArtistEmail(artistEmail)) {
      return;
    }

    if (canvasRef.current.isEmpty()) {
      toast.error('Please draw something before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      const imageData = canvasRef.current.exportImage(false);
      const artworkData = {
        imageData,
        promptId: prompt.id,
        promptText: prompt.prompt,
        promptNumber: prompt.promptNumber,
        artistName: artistName.trim(),
        artistEmail: artistEmail.trim(),
        isAdminCreated: false,
      };
      console.log('[UserDrawPage] Submitting artwork with data:', {
        ...artworkData,
        imageData: `${imageData.substring(0, 50)}... (${imageData.length} chars)`,
      });
      await addArtwork(artworkData);

      if (artistEmail.trim()) {
        toast.success('YOUR ARTWORK HAS BEEN SUBMITTED! CHECK YOUR EMAIL TO RECEIVE IT. BROWSE MORE PROMPTS TO CREATE MORE ART!', {
          duration: 5000,
        });
      } else {
        toast.success('YOUR ARTWORK HAS BEEN SUBMITTED! BROWSE MORE PROMPTS TO CREATE MORE ART!', {
          duration: 5000,
        });
      }

      navigate('/prompts');
    } catch (error) {
      toast.error('Failed to submit artwork');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }, [artistName, artistEmail, prompt, validateArtistName, validateArtistEmail, addArtwork, navigate]);

  const isSubmitDisabled = !artistName.trim() || isSubmitting || !hasDrawn || !!nameError || !!emailError;

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-6 pb-6 px-4">
      {/* Main Content Container */}
      <div className="w-full max-w-7xl flex flex-col lg:flex-row items-start justify-center gap-6 lg:gap-8">
        {/* Canvas */}
        <div className="w-full lg:w-auto lg:flex-shrink-0">
          <div className="bg-muted/20 rounded-lg p-3 sm:p-4 w-full max-w-[95vw] sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mx-auto lg:mx-0">
            <DrawingCanvas
              ref={canvasRef}
              brush={brush}
              onDrawStart={() => setHasDrawn(true)}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="w-full lg:w-96 lg:flex-shrink-0 space-y-4">
          {/* Drawing Prompt Display */}
          <div className="bg-card border border-border rounded-lg p-4 mt-8 text-left">
            <div className="text-muted-foreground text-xs mb-2 uppercase" style={{ fontFamily: 'FK Grotesk Mono, monospace' }}>
              Drawing Prompt:
            </div>
            <div className="text-foreground text-sm font-medium" style={{ fontFamily: 'FK Grotesk Mono, monospace' }}>
              {prompt.prompt}
            </div>
          </div>

          {/* Artist Name */}
          <div className="space-y-2">
            <label htmlFor="artist-name" className="text-muted-foreground text-sm font-medium uppercase" style={{ fontFamily: 'FK Grotesk Mono, monospace' }}>
              Your Name
            </label>
            <Input
              id="artist-name"
              value={artistName}
              onChange={handleArtistNameChange}
              placeholder="Artist name"
              className="bg-card border-border text-foreground placeholder:text-muted-foreground h-10 transition-all duration-200 hover:border-primary focus:border-primary"
              style={{ fontFamily: 'Delcan Mono, monospace' }}
              maxLength={100}
              autoComplete="name"
              aria-invalid={!!nameError}
              aria-describedby={nameError ? "name-error" : undefined}
            />
            {nameError && (
              <p id="name-error" className="text-xs text-red-400 mt-1" role="alert" style={{ fontFamily: 'FK Grotesk Mono, monospace' }}>
                {nameError}
              </p>
            )}
          </div>

          {/* Artist Email */}
          <div className="space-y-2">
            <label htmlFor="artist-email" className="text-muted-foreground text-sm font-medium uppercase" style={{ fontFamily: 'FK Grotesk Mono, monospace' }}>
              Your Email (optional)
            </label>
            <Input
              id="artist-email"
              type="email"
              value={artistEmail}
              onChange={handleArtistEmailChange}
              placeholder="Add your email here"
              className="bg-card border-border text-foreground placeholder:text-muted-foreground h-10 transition-all duration-200 hover:border-primary focus:border-primary"
              style={{ fontFamily: 'Delcan Mono, monospace' }}
              maxLength={254}
              autoComplete="email"
              aria-invalid={!!emailError}
              aria-describedby={emailError ? "email-error" : undefined}
            />
            {emailError && (
              <p id="email-error" className="text-xs text-red-400 mt-1" role="alert" style={{ fontFamily: 'FK Grotesk Mono, monospace' }}>
                {emailError}
              </p>
            )}
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
                onClick={clearCanvas}
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
                disabled={!hasDrawn}
                className="flex-1 h-10 rounded-lg bg-card border border-border flex items-center justify-center gap-2 text-muted-foreground hover:bg-accent hover:text-foreground hover:border-primary transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed px-4"
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
                onClick={handleSubmit}
                disabled={isSubmitDisabled}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed h-12 px-6 py-4 transition-all duration-200 text-sm font-semibold"
                style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
                type="button"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden="true" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" aria-hidden="true" />
                    Submit
                  </>
                )}
              </Button>

              <Button
                onClick={() => navigate('/prompts')}
                variant="ghost"
                className="w-full text-muted-foreground hover:text-foreground hover:bg-accent/50 h-11 transition-all duration-200"
                style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
                type="button"
              >
                Back to Prompts
              </Button>
            </div>
          </div>

          <div className="text-muted-foreground text-xs leading-relaxed bg-muted/30 rounded-lg p-4 mt-5" style={{ fontFamily: 'Delcan Mono, monospace' }}>
            Your artwork will be reviewed by an admin before appearing in the gallery. If you provide your email, we'll send you a copy of your artwork!
          </div>
        </div>
      </div>
    </div>
  );
}
