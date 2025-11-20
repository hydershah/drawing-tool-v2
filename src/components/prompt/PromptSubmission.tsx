/**
 * PromptSubmission Component
 * Multi-step animated form for submitting drawing prompts
 * Matches original design with flowing glow effects and morphing animations
 */

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';
import { ArrowRight, Loader2 } from 'lucide-react';
import { EMAIL_REGEX, MAX_PROMPT_LENGTH } from '@/utils/constants';

type Step = 'prompt' | 'email' | 'complete';

// Animation constants
const MORPH_ANIMATION_DURATION = 800;
const SUCCESS_MESSAGE_DURATION = 3000;
const BUTTON_GLOW_DURATION = 1500;
const BUTTON_GLOW_INTERVAL = 4000;

export function PromptSubmission() {
  const [prompt, setPrompt] = useState('');
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<Step>('prompt');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMorphing, setIsMorphing] = useState(false);
  const [showButtonGlow, setShowButtonGlow] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const { addPrompt } = useApp();

  // Button glow animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowButtonGlow(true);
      const timeout = setTimeout(() => setShowButtonGlow(false), BUTTON_GLOW_DURATION);
      return () => clearTimeout(timeout);
    }, BUTTON_GLOW_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Prompt validation
  const validatePrompt = useCallback((promptValue: string): boolean => {
    const trimmedPrompt = promptValue.trim();

    if (!trimmedPrompt) {
      return false;
    }

    if (trimmedPrompt.length > MAX_PROMPT_LENGTH) {
      toast.error(`Prompt is too long. Please keep it under ${MAX_PROMPT_LENGTH} characters.`);
      return false;
    }

    return true;
  }, []);

  // Reset form state
  const resetForm = useCallback(() => {
    setPrompt('');
    setEmail('');
    setStep('prompt');
    setEmailError(null);
  }, []);

  // Handle prompt step
  const handlePromptContinue = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!validatePrompt(prompt)) {
        return;
      }

      setStep('email');
      setEmailError(null);
    },
    [prompt, validatePrompt]
  );

  // Email validation
  const validateEmail = useCallback((value: string): boolean => {
    const trimmedEmail = value.trim();

    if (!trimmedEmail) {
      setEmailError('Please enter your email so we can notify you.');
      return false;
    }

    if (trimmedEmail.length > 254) {
      setEmailError('Email address is too long');
      return false;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address');
      return false;
    }

    setEmailError(null);
    return true;
  }, []);

  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(e.target.value);
      if (emailError) {
        setEmailError(null);
      }
    },
    [emailError]
  );

  // Handle final submission
  const handleEmailSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validatePrompt(prompt)) {
        setStep('prompt');
        return;
      }

      if (!validateEmail(email)) {
        return;
      }

      setIsMorphing(true);
      setIsSubmitting(true);

      try {
        await addPrompt(prompt.trim(), email.trim());

        setTimeout(() => {
          setStep('complete');
          setIsMorphing(false);
          setIsSubmitting(false);

          // Reset form after showing success message
          setTimeout(resetForm, SUCCESS_MESSAGE_DURATION);
        }, MORPH_ANIMATION_DURATION);
      } catch (error) {
        console.error('Error submitting prompt:', error);
        toast.error('Failed to submit prompt');
        setIsMorphing(false);
        setIsSubmitting(false);
      }
    },
    [prompt, email, validatePrompt, validateEmail, addPrompt, resetForm]
  );

  // Optimized input change handlers
  const handlePromptChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPrompt(e.target.value);
  }, []);

  // Check if inputs are valid
  const isPromptValid = prompt.trim().length > 0 && prompt.trim().length <= MAX_PROMPT_LENGTH;
  const isEmailReady = email.trim().length > 0 && EMAIL_REGEX.test(email.trim());

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-full max-w-2xl px-6">
        {step === 'prompt' && (
          <form onSubmit={handlePromptContinue} noValidate>
            <div
              className={`relative transition-all duration-400 ${
                isMorphing ? 'opacity-60 scale-[0.98]' : 'opacity-100 scale-100'
              }`}
            >
              {/* Subtle warm glow when typing */}
              {isPromptValid && (
                <div
                  className="absolute -inset-[2px] rounded-[32px] blur-md overflow-hidden"
                  aria-hidden="true"
                >
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/50 to-transparent"
                    style={{
                      width: '200%',
                      animation: 'flowGlow 2.5s ease-in-out infinite',
                    }}
                  />
                </div>
              )}

              {/* Input container */}
              <div className="relative border border-foreground/30 rounded-[36px] px-6 md:px-9 py-2.5 md:py-3 pr-2.5 md:pr-3 flex items-center gap-2 md:gap-4 bg-background w-full max-w-2xl mx-auto min-h-[48px] md:min-h-[56px]">
                <label htmlFor="prompt-input" className="sr-only">
                  Enter your drawing prompt
                </label>
                <Input
                  id="prompt-input"
                  value={prompt}
                  onChange={handlePromptChange}
                  placeholder="What should I draw for you today?"
                  className="bg-transparent border-none text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 px-0 flex-1 text-xl md:text-2xl h-7 md:h-8"
                  style={{ fontFamily: 'Delcan Mono, monospace' }}
                  autoFocus
                  disabled={isMorphing}
                  maxLength={MAX_PROMPT_LENGTH}
                  autoComplete="off"
                  aria-invalid={prompt.length > MAX_PROMPT_LENGTH}
                  aria-describedby={prompt.length > 400 ? 'prompt-hint' : undefined}
                />
                <Button
                  type="submit"
                  disabled={!isPromptValid || isMorphing}
                  className={`relative overflow-hidden text-white hover:opacity-90 disabled:opacity-50 rounded-full p-0 flex items-center justify-center shrink-0 transition-all duration-500 w-12 h-12 ${
                    isPromptValid
                      ? 'bg-gradient-to-r from-[#e89bb5] to-[#8b95a6] animate-gradient'
                      : 'bg-primary text-primary-foreground'
                  }`}
                  aria-label="Submit prompt"
                >
                  {/* Pink gradient glow overlay */}
                  <div
                    className={`absolute inset-0 rounded-full transition-opacity duration-700 pointer-events-none ${
                      showButtonGlow ? 'opacity-100' : 'opacity-0'
                    }`}
                    style={{
                      background:
                        'radial-gradient(circle, rgba(232, 155, 181, 0.6) 0%, rgba(232, 155, 181, 0.3) 50%, transparent 70%)',
                    }}
                    aria-hidden="true"
                  />
                  {isMorphing ? (
                    <Loader2 className="w-7 h-7 relative z-10 animate-spin" aria-hidden="true" />
                  ) : (
                    <ArrowRight className="w-7 h-7 relative z-10" aria-hidden="true" />
                  )}
                </Button>
              </div>

              {/* Character count hint */}
              {prompt.length > 400 && (
                <div
                  id="prompt-hint"
                  className="text-xs text-muted-foreground/60 mt-2 px-9"
                >
                  {MAX_PROMPT_LENGTH - prompt.length} characters remaining
                </div>
              )}
            </div>
          </form>
        )}

        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} noValidate>
            <div
              className={`relative transition-all duration-400 ${
                isMorphing ? 'opacity-60 scale-[0.98]' : 'opacity-100 scale-100'
              }`}
            >
              {/* Subtle warm glow when typing */}
              {isEmailReady && (
                <div
                  className="absolute -inset-[2px] rounded-[32px] blur-md overflow-hidden"
                  aria-hidden="true"
                >
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/50 to-transparent"
                    style={{
                      width: '200%',
                      animation: 'flowGlow 2.5s ease-in-out infinite',
                    }}
                  />
                </div>
              )}

              {/* Input container */}
              <div className="relative border border-foreground/30 rounded-[36px] px-6 md:px-9 py-2.5 md:py-3 pr-2.5 md:pr-3 flex items-center gap-2 md:gap-4 bg-background w-full max-w-2xl mx-auto min-h-[48px] md:min-h-[56px]">
                <label htmlFor="prompt-email" className="sr-only">
                  Enter your email address
                </label>
                <Input
                  id="prompt-email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="Add your email here"
                  className="bg-transparent border-none text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 px-0 flex-1 text-lg md:text-xl h-7 md:h-8"
                  style={{ fontFamily: 'Delcan Mono, monospace' }}
                  autoFocus
                  disabled={isSubmitting}
                  maxLength={254}
                  autoComplete="email"
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? 'email-error' : undefined}
                />
                <Button
                  type="submit"
                  disabled={!isEmailReady || isSubmitting}
                  className={`relative overflow-hidden text-white hover:opacity-90 disabled:opacity-50 rounded-full p-0 flex items-center justify-center shrink-0 transition-all duration-500 w-12 h-12 ${
                    isEmailReady
                      ? 'bg-gradient-to-r from-[#e89bb5] to-[#8b95a6] animate-gradient'
                      : 'bg-primary text-primary-foreground'
                  }`}
                  aria-label="Submit email"
                >
                  {/* Pink gradient glow overlay */}
                  <div
                    className={`absolute inset-0 rounded-full transition-opacity duration-700 pointer-events-none ${
                      showButtonGlow ? 'opacity-100' : 'opacity-0'
                    }`}
                    style={{
                      background:
                        'radial-gradient(circle, rgba(232, 155, 181, 0.6) 0%, rgba(232, 155, 181, 0.3) 50%, transparent 70%)',
                    }}
                    aria-hidden="true"
                  />
                  {isSubmitting ? (
                    <Loader2 className="w-7 h-7 relative z-10 animate-spin" aria-hidden="true" />
                  ) : (
                    <ArrowRight className="w-7 h-7 relative z-10" aria-hidden="true" />
                  )}
                </Button>
              </div>

              {/* Email error */}
              {emailError && (
                <div id="email-error" className="text-xs text-red-400 mt-2 px-9" role="alert">
                  {emailError}
                </div>
              )}
            </div>
          </form>
        )}

        {step === 'complete' && (
          <div className="relative animate-fadeIn" role="status" aria-live="polite">
            <p className="text-center text-foreground/70 no-underline text-xs uppercase tracking-wider" style={{ fontFamily: 'FK Grotesk Mono, monospace' }}>
              Thanks! We'll email you as soon as someone draws your prompt.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
