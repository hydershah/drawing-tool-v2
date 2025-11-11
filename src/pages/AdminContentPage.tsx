/**
 * AdminContentPage
 * Manage site-wide content and settings
 */

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from 'sonner';
import { Save, RotateCcw, BookOpen, Info, FileText } from 'lucide-react';

interface SiteContent {
  bookTitle: string;
  bookDescription: string;
  amazonUrl: string;
  bookshopUrl: string;
  barnesNobleUrl: string;
  projectDescription: string;
  aboutProjectDescription: string;
  aboutFeatures: string;
  aboutBrushEngine: string;
  aboutHowItWorks: string;
  aboutDesignPhilosophy: string;
}

const DEFAULT_CONTENT: SiteContent = {
  bookTitle: 'Prompt-Brush 1.0',
  bookDescription: 'Get the original book:',
  amazonUrl: 'https://www.amazon.com/Prompt-Brush-1-0-Drawing-Prompts-Illustrations/dp/B0DJXC29W8',
  bookshopUrl: 'https://bookshop.org/p/books/prompt-brush-1-0-500-drawing-prompts-for-daily-practice-and-wild-illustrations-hyder-jaffrey/21703254',
  barnesNobleUrl: 'https://www.barnesandnoble.com/w/prompt-brush-10-hyder-jaffrey/1146466982',
  projectDescription: '500 Drawing Prompts for Daily Practice and Wild Illustrations',
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

const STORAGE_KEY = 'site_content';

function loadContent(): SiteContent {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_CONTENT, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error loading site content:', error);
  }
  return DEFAULT_CONTENT;
}

function saveContent(content: SiteContent): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
  } catch (error) {
    console.error('Error saving site content:', error);
    throw error;
  }
}

export function AdminContentPage() {
  const [content, setContent] = useState<SiteContent>(loadContent());
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: keyof SiteContent, value: string) => {
    setContent((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      saveContent(content);
      setHasChanges(false);
      toast.success('Content saved successfully!');

      // Dispatch custom event to notify BookInfo component to update
      window.dispatchEvent(new CustomEvent('siteContentUpdated'));
    } catch (error) {
      toast.error('Failed to save content');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Reset all content to defaults? This cannot be undone.')) {
      setContent(DEFAULT_CONTENT);
      setHasChanges(true);
      toast.success('Content reset to defaults');
    }
  };

  const handleReload = () => {
    setContent(loadContent());
    setHasChanges(false);
    toast.success('Content reloaded');
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1
            className="text-[15px] font-medium"
            style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
          >
            Site Content Management
          </h1>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleReload}
              disabled={isSaving}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reload
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              disabled={isSaving}
            >
              Reset to Defaults
            </Button>
          </div>
        </div>

        {/* Book Information Section */}
        <div className="space-y-6 p-6 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-muted-foreground" />
            <h2
              className="text-[14px] font-medium"
              style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
            >
              Book Information
            </h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label
                className="text-[12px] text-muted-foreground"
                style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
              >
                Book Title
              </label>
              <Input
                value={content.bookTitle}
                onChange={(e) => handleChange('bookTitle', e.target.value)}
                placeholder="Enter book title"
                className="text-[13px]"
                style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-[12px] text-muted-foreground"
                style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
              >
                Book Description
              </label>
              <Input
                value={content.bookDescription}
                onChange={(e) => handleChange('bookDescription', e.target.value)}
                placeholder="Enter description"
                className="text-[13px]"
                style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-[12px] text-muted-foreground"
                style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
              >
                Amazon URL
              </label>
              <Input
                type="url"
                value={content.amazonUrl}
                onChange={(e) => handleChange('amazonUrl', e.target.value)}
                placeholder="https://amazon.com/..."
                className="text-[11px]"
                style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-[12px] text-muted-foreground"
                style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
              >
                Bookshop.org URL
              </label>
              <Input
                type="url"
                value={content.bookshopUrl}
                onChange={(e) => handleChange('bookshopUrl', e.target.value)}
                placeholder="https://bookshop.org/..."
                className="text-[11px]"
                style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-[12px] text-muted-foreground"
                style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
              >
                Barnes & Noble URL
              </label>
              <Input
                type="url"
                value={content.barnesNobleUrl}
                onChange={(e) => handleChange('barnesNobleUrl', e.target.value)}
                placeholder="https://barnesandnoble.com/..."
                className="text-[11px]"
                style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
              />
            </div>
          </div>
        </div>

        {/* Project Information Section */}
        <div className="space-y-6 p-6 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-muted-foreground" />
            <h2
              className="text-[14px] font-medium"
              style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
            >
              Project Information
            </h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label
                className="text-[12px] text-muted-foreground"
                style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
              >
                Project Description
              </label>
              <Input
                value={content.projectDescription}
                onChange={(e) => handleChange('projectDescription', e.target.value)}
                placeholder="Brief project description"
                className="text-[13px]"
                style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
              />
            </div>
          </div>
        </div>

        {/* About Sidebar Content Section */}
        <div className="space-y-6 p-6 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <h2
              className="text-[14px] font-medium"
              style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
            >
              About Sidebar Content
            </h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label
                className="text-[12px] text-muted-foreground"
                style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
              >
                About the Project
              </label>
              <Textarea
                value={content.aboutProjectDescription}
                onChange={(e) => handleChange('aboutProjectDescription', e.target.value)}
                placeholder="Description of the project"
                className="text-[13px] min-h-[100px]"
                style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-[12px] text-muted-foreground"
                style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
              >
                Features (one per line)
              </label>
              <Textarea
                value={content.aboutFeatures}
                onChange={(e) => handleChange('aboutFeatures', e.target.value)}
                placeholder="List features, one per line"
                className="text-[13px] min-h-[120px]"
                style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-[12px] text-muted-foreground"
                style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
              >
                Brush Engine
              </label>
              <Textarea
                value={content.aboutBrushEngine}
                onChange={(e) => handleChange('aboutBrushEngine', e.target.value)}
                placeholder="Description of the brush engine"
                className="text-[13px] min-h-[100px]"
                style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-[12px] text-muted-foreground"
                style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
              >
                How It Works (one step per line)
              </label>
              <Textarea
                value={content.aboutHowItWorks}
                onChange={(e) => handleChange('aboutHowItWorks', e.target.value)}
                placeholder="List steps, one per line"
                className="text-[13px] min-h-[120px]"
                style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-[12px] text-muted-foreground"
                style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
              >
                Design Philosophy
              </label>
              <Textarea
                value={content.aboutDesignPhilosophy}
                onChange={(e) => handleChange('aboutDesignPhilosophy', e.target.value)}
                placeholder="Design philosophy description"
                className="text-[13px] min-h-[100px]"
                style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3 pt-4">
          {hasChanges && (
            <div
              className="text-[12px] text-yellow-500 flex items-center"
              style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
            >
              Unsaved changes
            </div>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="min-w-32"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* Preview Section */}
        <div className="p-6 bg-accent/10 border border-border rounded-lg">
          <h3
            className="text-[13px] font-medium mb-4"
            style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
          >
            Preview
          </h3>
          <div
            className="space-y-3 text-[12px]"
            style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
          >
            <div>
              <span className="text-muted-foreground">Title: </span>
              <span className="text-foreground">{content.bookTitle}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Description: </span>
              <span className="text-foreground">{content.bookDescription}</span>
            </div>
            <div className="space-y-1 pt-2">
              <div className="text-muted-foreground">Book Links:</div>
              <div className="pl-4 space-y-1">
                <div>
                  <span className="text-muted-foreground">• Amazon: </span>
                  <span className="text-foreground break-all">{content.amazonUrl}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">• Bookshop: </span>
                  <span className="text-foreground break-all">{content.bookshopUrl}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">• B&N: </span>
                  <span className="text-foreground break-all">{content.barnesNobleUrl}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Note */}
        <div
          className="text-[11px] text-muted-foreground italic p-4 bg-accent/5 border border-border rounded-lg"
          style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
        >
          Note: Changes will be reflected immediately after saving. The book information popup
          will update automatically.
        </div>
      </div>
    </div>
  );
}

// Export function to get content for use in other components
export function getSiteContent(): SiteContent {
  return loadContent();
}
