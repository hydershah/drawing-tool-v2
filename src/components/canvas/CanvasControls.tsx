/**
 * CanvasControls Component
 * Brush settings controls for the drawing canvas
 */

import { Label } from '@/components/ui/Label';
import { Slider } from '@/components/ui/Slider';
import { Button } from '@/components/ui/Button';
import type { BrushSettings } from '@/types';
import {
  MIN_BRUSH_SIZE,
  MAX_BRUSH_SIZE,
  MIN_DENSITY,
  MAX_DENSITY,
  MIN_CONTRAST,
  MAX_CONTRAST,
} from '@/utils/constants';

interface CanvasControlsProps {
  brush: BrushSettings;
  onBrushChange: (brush: BrushSettings) => void;
  onClear: () => void;
  onSave: () => void;
  canSave?: boolean;
}

export function CanvasControls({
  brush,
  onBrushChange,
  onClear,
  onSave,
  canSave = true,
}: CanvasControlsProps) {
  return (
    <div className="space-y-6 p-6 bg-card rounded-lg border">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="brush-size">Brush Size: {brush.size}</Label>
          <Slider
            id="brush-size"
            min={MIN_BRUSH_SIZE}
            max={MAX_BRUSH_SIZE}
            step={1}
            value={[brush.size]}
            onValueChange={([size]) => onBrushChange({ ...brush, size })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ink-density">Ink Density: {brush.density}</Label>
          <Slider
            id="ink-density"
            min={MIN_DENSITY}
            max={MAX_DENSITY}
            step={1}
            value={[brush.density]}
            onValueChange={([density]) => onBrushChange({ ...brush, density })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contrast">Contrast: {brush.contrast}</Label>
          <Slider
            id="contrast"
            min={MIN_CONTRAST}
            max={MAX_CONTRAST}
            step={1}
            value={[brush.contrast]}
            onValueChange={([contrast]) => onBrushChange({ ...brush, contrast })}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={onClear} variant="outline" className="flex-1">
          Clear Canvas
        </Button>
        <Button onClick={onSave} disabled={!canSave} className="flex-1">
          Save Artwork
        </Button>
      </div>
    </div>
  );
}
