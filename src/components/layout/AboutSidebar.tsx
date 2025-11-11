/**
 * AboutSidebar Component
 * Sliding sidebar with project information that opens on logo click
 */

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface AboutSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AboutContent {
  aboutProjectDescription: string;
  aboutFeatures: string;
  aboutBrushEngine: string;
  aboutHowItWorks: string;
  aboutDesignPhilosophy: string;
}

const DEFAULT_ABOUT_CONTENT: AboutContent = {
  aboutProjectDescription: 'Prompt-Brush 2.0 is a web-based drawing application featuring a realistic brush drawing tool that creates organic, variable-thickness strokes mimicking real brush behavior with black ink on a warm beige artboard background.',
  aboutFeatures: `500x700px portrait canvas with warm beige (#f4efe9) background
Speed-sensitive brush with natural texture and grain
Email functionality to send artwork as PNG attachments
Community gallery with admin approval system
User submission system for prompt-based artwork
Dark/light mode toggle
Minimalistic icon-based navigation`,
  aboutBrushEngine: 'The brush engine uses advanced techniques including speed-sensitive line weight, multiple overlapping circles for natural texture, and random micro-variations to create authentic brush grain with darker cores and lighter semi-transparent edges.',
  aboutHowItWorks: `Browse available prompts from the gallery
Select a prompt that inspires you
Create your artwork using the brush tool
Submit your work for admin approval
Once approved, your artwork appears in the public gallery`,
  aboutDesignPhilosophy: 'Prompt-Brush 2.0 embraces a minimalistic design with a focus on the creative process. The interface stays out of your way, letting you concentrate on your art while providing all the tools you need for expressive brush work.',
};

function loadAboutContent(): AboutContent {
  try {
    const stored = localStorage.getItem('site_content');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        aboutProjectDescription: parsed.aboutProjectDescription || DEFAULT_ABOUT_CONTENT.aboutProjectDescription,
        aboutFeatures: parsed.aboutFeatures || DEFAULT_ABOUT_CONTENT.aboutFeatures,
        aboutBrushEngine: parsed.aboutBrushEngine || DEFAULT_ABOUT_CONTENT.aboutBrushEngine,
        aboutHowItWorks: parsed.aboutHowItWorks || DEFAULT_ABOUT_CONTENT.aboutHowItWorks,
        aboutDesignPhilosophy: parsed.aboutDesignPhilosophy || DEFAULT_ABOUT_CONTENT.aboutDesignPhilosophy,
      };
    }
  } catch (error) {
    console.error('Error loading about content:', error);
  }
  return DEFAULT_ABOUT_CONTENT;
}

export function AboutSidebar({ isOpen, onClose }: AboutSidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState<AboutContent>(loadAboutContent());

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

  // Listen for content updates
  useEffect(() => {
    function handleContentUpdate() {
      setContent(loadAboutContent());
    }

    window.addEventListener('siteContentUpdated', handleContentUpdate);
    return () => {
      window.removeEventListener('siteContentUpdated', handleContentUpdate);
    };
  }, []);

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
              {content.aboutProjectDescription}
            </p>
          </section>

          {/* Features */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Features</h2>
            <ul className="space-y-2 text-muted-foreground">
              {content.aboutFeatures.split('\n').filter(line => line.trim()).map((feature, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{feature.trim()}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Brush Engine */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Brush Engine</h2>
            <p className="text-muted-foreground leading-relaxed">
              {content.aboutBrushEngine}
            </p>
          </section>

          {/* How It Works */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">How It Works</h2>
            <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
              {content.aboutHowItWorks.split('\n').filter(line => line.trim()).map((step, index) => (
                <li key={index}>{step.trim()}</li>
              ))}
            </ol>
          </section>

          {/* Design Philosophy */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Design Philosophy</h2>
            <p className="text-muted-foreground leading-relaxed">
              {content.aboutDesignPhilosophy}
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
