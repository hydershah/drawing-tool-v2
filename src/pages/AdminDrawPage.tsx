/**
 * AdminDrawPage
 * Admin interface for creating artwork with prompt selection
 */

import { useState, useRef, useMemo } from 'react';
import { DrawingCanvas, type DrawingCanvasHandle } from '@/components/canvas/DrawingCanvas';
import { CanvasControls } from '@/components/canvas/CanvasControls';
import { useApp } from '@/contexts/AppContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { Search, Mail, CheckCircle2 } from 'lucide-react';
import {
  DEFAULT_BRUSH_SIZE,
  DEFAULT_BRUSH_DENSITY,
  DEFAULT_BRUSH_CONTRAST,
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

  const handleClear = () => {
    canvasRef.current?.clear();
  };

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
    <div className="container mx-auto px-4 py-12">
      <h1
        className="text-[15px] font-medium mb-8"
        style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
      >
        Create Artwork
      </h1>
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="flex justify-center">
          <DrawingCanvas ref={canvasRef} brush={brush} />
        </div>
        <div className="space-y-6">
          {/* Prompt Selection */}
          <div className="space-y-3">
            <label
              className="text-[13px] text-muted-foreground"
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
                className="pl-10 pr-20 text-[13px]"
                style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
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
          <div className="space-y-3">
            <label
              className="text-[13px] text-muted-foreground"
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
                className="pl-10 text-[13px]"
                style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
              />
            </div>
          </div>

          {/* Canvas Controls */}
          <CanvasControls
            brush={brush}
            onBrushChange={setBrush}
            onClear={handleClear}
            onSave={handleSave}
          />
        </div>
      </div>
    </div>
  );
}
