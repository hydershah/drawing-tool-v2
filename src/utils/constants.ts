/**
 * Application-wide constants
 */

// Canvas configuration
export const CANVAS_WIDTH = 500;
export const CANVAS_HEIGHT = 700;
export const CANVAS_BACKGROUND = '#f4efe9'; // Warm beige
export const EXPORT_SCALE = 8; // 8x scale = 4000×5600px output (13.3×18.6" at 300 DPI)
export const EXPORT_BORDER_WIDTH = 20;

// Brush settings defaults
export const DEFAULT_BRUSH_SIZE = 10;
export const DEFAULT_BRUSH_DENSITY = 74;
export const DEFAULT_BRUSH_CONTRAST = 100;

// Brush settings ranges
export const MIN_BRUSH_SIZE = 5;
export const MAX_BRUSH_SIZE = 80;
export const MIN_DENSITY = 10;
export const MAX_DENSITY = 100;
export const MIN_CONTRAST = 0;
export const MAX_CONTRAST = 100;

// Aliases for consistency with original code
export const BRUSH_SIZE_MIN = MIN_BRUSH_SIZE;
export const BRUSH_SIZE_MAX = MAX_BRUSH_SIZE;
export const BRUSH_DENSITY_MIN = MIN_DENSITY;
export const BRUSH_DENSITY_MAX = MAX_DENSITY;
export const BRUSH_CONTRAST_MIN = MIN_CONTRAST;
export const BRUSH_CONTRAST_MAX = MAX_CONTRAST;

// Prompt settings
export const MAX_PROMPT_LENGTH = 500;
export const PROMPT_PLACEHOLDER = 'Enter your drawing prompt...';

// Email validation
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Storage keys
export const STORAGE_KEYS = {
  PROMPTS: 'drawing-tool-prompts',
  ARTWORKS: 'drawing-tool-artworks',
  SITE_CONTENT: 'drawing-tool-site-content',
  ADMIN_SESSION: 'drawing-tool-admin',
  THEME: 'drawing-tool-theme',
} as const;

// Admin
export const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'; // Fallback to default if env var not set

// Pagination
export const ITEMS_PER_PAGE = 20;

// Gallery settings
export const GALLERY_POLL_INTERVAL = 5000; // 5 seconds

// Animation durations (ms)
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Logo animations
export const LOGO_ANIMATIONS = [
  'spin',
  'bounce',
  'pulse',
  'wiggle',
  'swing',
  'float',
  'tilt',
  'rotate3d',
  'scale',
  'flip',
  'shake',
  'glow',
] as const;

export type LogoAnimation = typeof LOGO_ANIMATIONS[number];
