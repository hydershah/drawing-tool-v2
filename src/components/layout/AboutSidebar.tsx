/**
 * AboutSidebar Component
 * Sliding sidebar with project information that opens on logo click
 */

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface AboutSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutSidebar({ isOpen, onClose }: AboutSidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;

      // Check if click is on the logo (has the logo's fixed positioning class pattern)
      const isLogoClick = target.closest('.fixed.top-4.left-4') !== null;

      if (
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(target) &&
        !isLogoClick
      ) {
        onClose();
      }
    }

    if (isOpen) {
      // Add a small delay to prevent immediate closing on logo click
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle escape key to close
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed left-0 top-0 h-full w-[380px] bg-background border-r border-border shadow-2xl z-50 transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-accent transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-8 pt-24 pl-24">
          {/* About the Project */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">About the Project</h2>
            <p className="text-muted-foreground leading-relaxed">
              Prompt-Brush 2.0 is a web-based drawing application featuring a realistic brush
              drawing tool that creates organic, variable-thickness strokes mimicking real brush
              behavior with black ink on a warm beige artboard background.
            </p>
          </section>

          {/* Features */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Features</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>500x700px portrait canvas with warm beige (#f4efe9) background</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Speed-sensitive brush with natural texture and grain</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Email functionality to send artwork as PNG attachments</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Community gallery with admin approval system</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>User submission system for prompt-based artwork</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Dark/light mode toggle</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Minimalistic icon-based navigation</span>
              </li>
            </ul>
          </section>

          {/* Brush Engine */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Brush Engine</h2>
            <p className="text-muted-foreground leading-relaxed">
              The brush engine uses advanced techniques including speed-sensitive line weight,
              multiple overlapping circles for natural texture, and random micro-variations to
              create authentic brush grain with darker cores and lighter semi-transparent edges.
            </p>
          </section>

          {/* How It Works */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">How It Works</h2>
            <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
              <li>Browse available prompts from the gallery</li>
              <li>Select a prompt that inspires you</li>
              <li>Create your artwork using the brush tool</li>
              <li>Submit your work for admin approval</li>
              <li>Once approved, your artwork appears in the public gallery</li>
            </ol>
          </section>

          {/* Design Philosophy */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Design Philosophy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Prompt-Brush 2.0 embraces a minimalistic design with a focus on the creative process.
              The interface stays out of your way, letting you concentrate on your art while
              providing all the tools you need for expressive brush work.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
