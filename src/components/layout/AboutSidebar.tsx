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

const DEFAULT_SIDEBAR_CONTENT = `<h2>About the Project</h2>
<p>Prompt-Brush 2.0 is a web-based drawing application featuring a realistic brush drawing tool that creates organic, variable-thickness strokes mimicking real brush behavior with black ink on a warm beige artboard background.</p>

<h2>Features</h2>
<ul>
<li>500x700px portrait canvas with warm beige (#f4efe9) background</li>
<li>Speed-sensitive brush with natural texture and grain</li>
<li>Email functionality to send artwork as PNG attachments</li>
<li>Community gallery with admin approval system</li>
<li>User submission system for prompt-based artwork</li>
<li>Dark/light mode toggle</li>
<li>Minimalistic icon-based navigation</li>
</ul>

<h2>Brush Engine</h2>
<p>The brush engine uses advanced techniques including speed-sensitive line weight, multiple overlapping circles for natural texture, and random micro-variations to create authentic brush grain with darker cores and lighter semi-transparent edges.</p>

<h2>How It Works</h2>
<ol>
<li>Browse available prompts from the gallery</li>
<li>Select a prompt that inspires you</li>
<li>Create your artwork using the brush tool</li>
<li>Submit your work for admin approval</li>
<li>Once approved, your artwork appears in the public gallery</li>
</ol>

<h2>Design Philosophy</h2>
<p>Prompt-Brush 2.0 embraces a minimalistic design with a focus on the creative process. The interface stays out of your way, letting you concentrate on your art while providing all the tools you need for expressive brush work.</p>`;

function loadSidebarContent(): string {
  try {
    const stored = localStorage.getItem('site_content');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.sidebarContent || DEFAULT_SIDEBAR_CONTENT;
    }
  } catch (error) {
    console.error('Error loading sidebar content:', error);
  }
  return DEFAULT_SIDEBAR_CONTENT;
}

export function AboutSidebar({ isOpen, onClose }: AboutSidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState<string>(loadSidebarContent());

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
      console.log('AboutSidebar received siteContentUpdated event');
      const newContent = loadSidebarContent();
      console.log('Loaded new content:', newContent);
      setContent(newContent);
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
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed left-0 top-0 h-full w-full sm:w-[85%] md:w-[480px] bg-background border-r border-border shadow-2xl z-[9999] transition-transform duration-300 ease-in-out overflow-y-auto ${
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
        <div
          className="p-6 pt-16 sm:p-8 sm:pt-24 md:pl-24 sidebar-content"
          style={{ fontFamily: 'Martina Plantijn, Georgia, serif' }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </>
  );
}
