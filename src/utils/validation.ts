/**
 * Validation utilities
 */

import { EMAIL_REGEX, MAX_PROMPT_LENGTH } from './constants';

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validate prompt text
 */
export function isValidPrompt(prompt: string): boolean {
  const trimmed = prompt.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_PROMPT_LENGTH;
}

/**
 * Validate artist name
 */
export function isValidArtistName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= 100;
}

/**
 * Get validation error message for email
 */
export function getEmailError(email: string): string | null {
  if (!email.trim()) return 'Email is required';
  if (!isValidEmail(email)) return 'Please enter a valid email address';
  return null;
}

/**
 * Get validation error message for prompt
 */
export function getPromptError(prompt: string): string | null {
  const trimmed = prompt.trim();
  if (!trimmed) return 'Prompt is required';
  if (trimmed.length > MAX_PROMPT_LENGTH) {
    return `Prompt must be ${MAX_PROMPT_LENGTH} characters or less`;
  }
  return null;
}

/**
 * Get validation error message for artist name
 */
export function getArtistNameError(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Artist name is required';
  if (trimmed.length > 100) return 'Artist name must be 100 characters or less';
  return null;
}
