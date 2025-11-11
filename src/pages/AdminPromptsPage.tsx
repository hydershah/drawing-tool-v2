/**
 * AdminPromptsPage
 * Admin interface for managing prompts
 */

import { useState, useCallback, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Separator } from '@/components/ui/Separator';
import {
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Mail,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { formatDate } from '@/utils/format';
import { toast } from 'sonner';
import type { Prompt } from '@/types';

type FilterStatus = 'all' | 'pending' | 'completed';

interface PromptItemProps {
  prompt: Prompt;
  isLast: boolean;
  onDelete: (id: string) => void;
  onAddEmail: (id: string, email: string) => void;
  isProcessing: boolean;
}

function PromptItem({ prompt, isLast, onDelete, onAddEmail, isProcessing }: PromptItemProps) {
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  const formattedDate = formatDate(prompt.createdAt);

  const handleAddEmailClick = useCallback(() => {
    setIsAddingEmail(true);
  }, []);

  const handleEmailSubmit = useCallback(() => {
    if (!emailInput.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput)) {
      toast.error('Please enter a valid email address');
      return;
    }

    onAddEmail(prompt.id, emailInput);
    setIsAddingEmail(false);
    setEmailInput('');
  }, [emailInput, onAddEmail, prompt.id]);

  const handleCancelEmail = useCallback(() => {
    setIsAddingEmail(false);
    setEmailInput('');
  }, []);

  return (
    <div>
      <div className="px-8 py-5 hover:bg-accent/10 transition-colors">
        <div className="flex items-start gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Prompt Text */}
            <div
              className="text-foreground text-[15px] leading-relaxed"
              style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
            >
              {prompt.prompt}
            </div>

            {/* Meta Information */}
            <div className="flex items-center gap-4 flex-wrap">
              <div
                className="text-muted-foreground text-[11px]"
                style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
              >
                {formattedDate}
              </div>

              {/* Email Display or Add */}
              {prompt.email ? (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-accent/30 rounded text-[11px]">
                  <Mail className="w-3 h-3" />
                  <span style={{ fontFamily: 'FK Grotesk Mono, monospace' }}>
                    {prompt.email}
                  </span>
                </div>
              ) : isAddingEmail ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="email@example.com"
                    className="h-7 text-[11px] w-48"
                    style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEmailSubmit();
                      if (e.key === 'Escape') handleCancelEmail();
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={handleEmailSubmit}
                    className="h-7 px-2 text-[11px]"
                  >
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelEmail}
                    className="h-7 px-2 text-[11px]"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleAddEmailClick}
                  className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  <Mail className="w-3 h-3 mr-1" />
                  Add Email
                </Button>
              )}

              {/* Status Badge */}
              {prompt.status === 'completed' ? (
                <div className="px-2 py-1 bg-green-500/15 text-green-400 rounded text-[11px] font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Completed</span>
                </div>
              ) : (
                <div className="px-2 py-1 bg-yellow-500/15 text-yellow-400 rounded text-[11px] font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Pending</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(prompt.id)}
              disabled={isProcessing}
              className="h-8 px-3 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              aria-label="Delete prompt"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      {!isLast && (
        <div className="px-8">
          <Separator className="bg-border" />
        </div>
      )}
    </div>
  );
}

export function AdminPromptsPage() {
  const { prompts, deletePrompt, addEmailToPrompt } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm('Are you sure you want to delete this prompt?')) {
        return;
      }

      setProcessingId(id);
      try {
        await deletePrompt(id);
        toast.success('Prompt deleted successfully');
      } catch (err) {
        console.error('Error deleting prompt:', err);
        toast.error('Failed to delete prompt');
      } finally {
        setProcessingId(null);
      }
    },
    [deletePrompt]
  );

  const handleAddEmail = useCallback(
    async (id: string, email: string) => {
      setProcessingId(id);
      try {
        await addEmailToPrompt(id, email);
        toast.success('Email added successfully');
      } catch (err) {
        console.error('Error adding email:', err);
        toast.error('Failed to add email');
      } finally {
        setProcessingId(null);
      }
    },
    [addEmailToPrompt]
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    toast.success('Prompts refreshed');
    setTimeout(() => setIsRefreshing(false), 500);
  }, []);

  // Filter and search prompts
  const filteredPrompts = useMemo(() => {
    let filtered = prompts;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((p) => p.status === filterStatus);
    }

    // Search
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.prompt.toLowerCase().includes(lowerQuery) ||
          p.email?.toLowerCase().includes(lowerQuery)
      );
    }

    return filtered;
  }, [prompts, filterStatus, searchQuery]);

  const stats = useMemo(() => {
    const total = prompts.length;
    const completed = prompts.filter((p) => p.status === 'completed').length;
    const pending = total - completed;
    const withEmail = prompts.filter((p) => p.email).length;

    return { total, completed, pending, withEmail };
  }, [prompts]);

  return (
    <div className="space-y-8 mt-24 px-8">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1
            className="text-foreground text-[15px] tracking-tight"
            style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
          >
            Prompt Management
          </h1>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="px-4 py-3 bg-card border border-border rounded-lg">
            <div
              className="text-muted-foreground text-[11px] mb-1"
              style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
            >
              Total Prompts
            </div>
            <div
              className="text-foreground text-[20px] font-medium"
              style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
            >
              {stats.total}
            </div>
          </div>
          <div className="px-4 py-3 bg-card border border-border rounded-lg">
            <div
              className="text-muted-foreground text-[11px] mb-1"
              style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
            >
              Completed
            </div>
            <div
              className="text-green-400 text-[20px] font-medium"
              style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
            >
              {stats.completed}
            </div>
          </div>
          <div className="px-4 py-3 bg-card border border-border rounded-lg">
            <div
              className="text-muted-foreground text-[11px] mb-1"
              style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
            >
              Pending
            </div>
            <div
              className="text-yellow-400 text-[20px] font-medium"
              style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
            >
              {stats.pending}
            </div>
          </div>
          <div className="px-4 py-3 bg-card border border-border rounded-lg">
            <div
              className="text-muted-foreground text-[11px] mb-1"
              style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
            >
              With Email
            </div>
            <div
              className="text-foreground text-[20px] font-medium"
              style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
            >
              {stats.withEmail}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span
              className="text-muted-foreground text-[13px]"
              style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
            >
              Status:
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={filterStatus === 'all' ? 'default' : 'ghost'}
              onClick={() => setFilterStatus('all')}
              className="h-8 text-[12px]"
            >
              All
            </Button>
            <Button
              size="sm"
              variant={filterStatus === 'pending' ? 'default' : 'ghost'}
              onClick={() => setFilterStatus('pending')}
              className="h-8 text-[12px]"
            >
              Pending
            </Button>
            <Button
              size="sm"
              variant={filterStatus === 'completed' ? 'default' : 'ghost'}
              onClick={() => setFilterStatus('completed')}
              className="h-8 text-[12px]"
            >
              Completed
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl w-full mx-auto">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search prompts or emails..."
            className="bg-card border-border text-foreground placeholder:text-muted-foreground pl-11 pr-11 rounded-[24px] text-[14px] h-11 focus:border-primary focus:ring-ring shadow-sm transition-all"
            style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
            autoComplete="off"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
              type="button"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {filteredPrompts.length === 0 ? (
        <div
          className="text-muted-foreground text-center py-16 text-[14px]"
          style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
        >
          {searchQuery || filterStatus !== 'all' ? (
            <>
              No prompts match your filters.
              <button
                onClick={() => {
                  clearSearch();
                  setFilterStatus('all');
                }}
                className="block mx-auto mt-4 text-muted-foreground hover:text-foreground underline text-[13px]"
                type="button"
              >
                Clear filters
              </button>
            </>
          ) : (
            'No prompts yet.'
          )}
        </div>
      ) : (
        <div className="space-y-0">
          {(searchQuery || filterStatus !== 'all') && (
            <div
              className="text-muted-foreground text-[13px] mb-4"
              style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
            >
              Showing {filteredPrompts.length} of {prompts.length}{' '}
              {prompts.length === 1 ? 'prompt' : 'prompts'}
            </div>
          )}
          <div className="space-y-0">
            {filteredPrompts.map((prompt, index) => (
              <PromptItem
                key={prompt.id}
                prompt={prompt}
                isLast={index === filteredPrompts.length - 1}
                onDelete={handleDelete}
                onAddEmail={handleAddEmail}
                isProcessing={processingId === prompt.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
