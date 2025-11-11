/**
 * DrawingCanvas Component
 * High-performance canvas with organic brush rendering
 * Rebuilt from scratch with modern React patterns and best practices
 */

import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import type { BrushSettings, DrawingPoint } from '@/types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CANVAS_BACKGROUND,
  EXPORT_SCALE,
  EXPORT_BORDER_WIDTH,
} from '@/utils/constants';

interface DrawingCanvasProps {
  brush: BrushSettings;
  onDrawStart?: () => void;
  onDrawEnd?: () => void;
}

export interface DrawingCanvasHandle {
  clear: () => void;
  exportImage: (includeMetadata?: boolean) => string;
  isEmpty: () => boolean;
}

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
  ({ brush, onDrawStart, onDrawEnd }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const lastPointRef = useRef<DrawingPoint | null>(null);
    const rafIdRef = useRef<number | null>(null);
    const hasDrawnRef = useRef(false);

    /**
     * Initialize canvas with background color
     */
    const initializeCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d', {
        willReadFrequently: false,
        alpha: false,
      });
      if (!ctx) return;

      ctx.fillStyle = CANVAS_BACKGROUND;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }, []);

    useEffect(() => {
      initializeCanvas();
    }, [initializeCanvas]);

    /**
     * Get canvas coordinates from pointer event
     * Handles both mouse and touch events with proper scaling
     */
    const getPointerPosition = useCallback(
      (event: React.MouseEvent | React.TouchEvent): DrawingPoint | null => {
        const canvas = canvasRef.current;
        if (!canvas) return null;

        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in event ? event.touches[0]?.clientX : event.clientX;
        const clientY = 'touches' in event ? event.touches[0]?.clientY : event.clientY;

        if (clientX === undefined || clientY === undefined) return null;

        // Scale coordinates from display size to canvas size
        const scaleX = CANVAS_WIDTH / rect.width;
        const scaleY = CANVAS_HEIGHT / rect.height;

        return {
          x: (clientX - rect.left) * scaleX,
          y: (clientY - rect.top) * scaleY,
          pressure: 1.0,
          timestamp: Date.now(),
        };
      },
      []
    );

    /**
     * Calculate dynamic brush parameters based on speed
     */
    const calculateBrushDynamics = useCallback(
      (from: DrawingPoint, to: DrawingPoint, baseSize: number) => {
        const distance = Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2);
        const timeDelta = to.timestamp - from.timestamp || 1;
        const speed = distance / timeDelta;

        // Faster strokes are thinner (simulates natural pen behavior)
        const speedFactor = Math.min(speed / 0.5, 1);
        const dynamicSize = baseSize * (1 - speedFactor * 0.3);

        return { distance, dynamicSize };
      },
      []
    );

    /**
     * Render organic brush stroke with randomized texture
     */
    const renderBrushStroke = useCallback(
      (
        ctx: CanvasRenderingContext2D,
        from: DrawingPoint,
        to: DrawingPoint,
        settings: BrushSettings
      ) => {
        const { distance, dynamicSize } = calculateBrushDynamics(from, to, settings.size);

        // Convert brush settings to rendering parameters
        const densityMultiplier = 0.2 + (settings.density / 100) * 1.8;
        const contrastMultiplier = 1.0 + (settings.contrast / 100) * 3.0;
        const coverageBoost = 1 + (settings.contrast / 100) * 0.5;

        // Calculate number of dots to draw for smooth stroke
        const baseSteps = Math.max(Math.floor(distance / 2), 1);
        const steps = Math.floor(baseSteps * coverageBoost);

        // Draw overlapping circles for organic texture
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const x = from.x + (to.x - from.x) * t;
          const y = from.y + (to.y - from.y) * t;

          // Add random offset for natural variation
          const jitterX = (Math.random() - 0.5) * dynamicSize * 0.15;
          const jitterY = (Math.random() - 0.5) * dynamicSize * 0.15;

          // Calculate opacity with randomness
          const baseOpacity = 0.08 + Math.random() * 0.04;
          const opacity = Math.min(
            baseOpacity * densityMultiplier * contrastMultiplier,
            0.8
          );

          // Draw single dot
          ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
          ctx.beginPath();
          ctx.arc(x + jitterX, y + jitterY, dynamicSize / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Add darker core for stroke definition
        const coreOpacity = Math.min(
          0.3 * densityMultiplier * contrastMultiplier,
          0.98
        );
        const coreSize = dynamicSize / (3.5 - settings.contrast / 100);
        ctx.fillStyle = `rgba(0, 0, 0, ${coreOpacity})`;
        ctx.beginPath();
        ctx.arc(to.x, to.y, coreSize, 0, Math.PI * 2);
        ctx.fill();
      },
      [calculateBrushDynamics]
    );

    /**
     * Draw initial dot when starting a stroke
     */
    const drawInitialDot = useCallback(
      (ctx: CanvasRenderingContext2D, point: DrawingPoint, settings: BrushSettings) => {
        const densityMultiplier = 0.2 + (settings.density / 100) * 1.8;
        const contrastMultiplier = 1.0 + (settings.contrast / 100) * 3.0;
        const dotOpacity = Math.min(0.4 * densityMultiplier * contrastMultiplier, 0.98);

        ctx.fillStyle = `rgba(0, 0, 0, ${dotOpacity})`;
        ctx.beginPath();
        ctx.arc(point.x, point.y, settings.size / 2, 0, Math.PI * 2);
        ctx.fill();
      },
      []
    );

    /**
     * Handle pointer down (start drawing)
     */
    const handlePointerDown = useCallback(
      (event: React.MouseEvent | React.TouchEvent) => {
        event.preventDefault();
        const point = getPointerPosition(event);
        if (!point) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        setIsDrawing(true);
        hasDrawnRef.current = true;
        lastPointRef.current = point;
        onDrawStart?.();

        // Draw initial dot
        drawInitialDot(ctx, point, brush);
      },
      [brush, getPointerPosition, drawInitialDot, onDrawStart]
    );

    /**
     * Handle pointer move (continue drawing)
     */
    const handlePointerMove = useCallback(
      (event: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !lastPointRef.current) return;

        event.preventDefault();
        const point = getPointerPosition(event);
        if (!point) return;

        // Cancel previous animation frame
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
        }

        // Schedule rendering on next animation frame
        rafIdRef.current = requestAnimationFrame(() => {
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (!ctx || !lastPointRef.current) return;

          renderBrushStroke(ctx, lastPointRef.current, point, brush);
          lastPointRef.current = point;
        });
      },
      [isDrawing, brush, getPointerPosition, renderBrushStroke]
    );

    /**
     * Handle pointer up/leave (stop drawing)
     */
    const handlePointerUp = useCallback(() => {
      if (isDrawing) {
        setIsDrawing(false);
        lastPointRef.current = null;
        onDrawEnd?.();
      }

      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    }, [isDrawing, onDrawEnd]);

    /**
     * Clear canvas and reset state
     */
    const clear = useCallback(() => {
      initializeCanvas();
      hasDrawnRef.current = false;
    }, [initializeCanvas]);

    /**
     * Export canvas as high-resolution image
     */
    const exportImage = useCallback((includeMetadata = false): string => {
      const canvas = canvasRef.current;
      if (!canvas) return '';

      const exportCanvas = document.createElement('canvas');
      const exportCtx = exportCanvas.getContext('2d');
      if (!exportCtx) return '';

      if (includeMetadata) {
        // Export with black matte border
        const borderSize = EXPORT_BORDER_WIDTH;
        exportCanvas.width = (CANVAS_WIDTH + borderSize * 2) * EXPORT_SCALE;
        exportCanvas.height = (CANVAS_HEIGHT + borderSize * 2) * EXPORT_SCALE;
        exportCtx.scale(EXPORT_SCALE, EXPORT_SCALE);
        exportCtx.imageSmoothingEnabled = true;
        exportCtx.imageSmoothingQuality = 'high';

        // Draw black background
        exportCtx.fillStyle = '#000000';
        exportCtx.fillRect(
          0,
          0,
          CANVAS_WIDTH + borderSize * 2,
          CANVAS_HEIGHT + borderSize * 2
        );

        // Draw canvas content with border
        exportCtx.drawImage(canvas, borderSize, borderSize);
      } else {
        // Export clean version
        exportCanvas.width = CANVAS_WIDTH * EXPORT_SCALE;
        exportCanvas.height = CANVAS_HEIGHT * EXPORT_SCALE;
        exportCtx.scale(EXPORT_SCALE, EXPORT_SCALE);
        exportCtx.imageSmoothingEnabled = true;
        exportCtx.imageSmoothingQuality = 'high';
        exportCtx.drawImage(canvas, 0, 0);
      }

      return exportCanvas.toDataURL('image/png');
    }, []);

    /**
     * Check if canvas has been drawn on
     */
    const isEmpty = useCallback(() => {
      return !hasDrawnRef.current;
    }, []);

    // Expose imperative handle to parent
    useImperativeHandle(
      ref,
      () => ({
        clear,
        exportImage,
        isEmpty,
      }),
      [clear, exportImage, isEmpty]
    );

    return (
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        className="cursor-crosshair rounded block w-full h-auto"
        style={{
          touchAction: 'none',
          backgroundColor: CANVAS_BACKGROUND,
          maxWidth: '100%',
          aspectRatio: '5/7',
          display: 'block'
        }}
        aria-label="Drawing canvas"
      />
    );
  }
);

DrawingCanvas.displayName = 'DrawingCanvas';
