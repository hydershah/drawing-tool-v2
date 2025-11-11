/**
 * AdminStats Component
 * Dashboard statistics for admin
 */

import { useMemo, memo, useState, useEffect, useCallback } from 'react';
import { TrendingUp, CheckCircle2, Clock, Users, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';

interface Submission {
  status?: 'pending' | 'completed' | 'in_progress';
  createdAt: number;
}

interface AdminStatsProps {
  submissions: Submission[];
  isLoading?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onRefresh?: () => void | Promise<void>;
}

interface Stat {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  subtext?: string;
}

const StatCard = memo(({ stat, isLoading }: { stat: Stat; isLoading?: boolean }) => {
  const Icon = stat.icon;

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24 bg-muted" />
            <Skeleton className="h-6 w-16 bg-muted" />
          </div>
          <Skeleton className="h-9 w-9 rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-5 transition-all hover:border-primary">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-muted-foreground mb-1 text-sm" style={{ fontFamily: 'FK Grotesk Mono, monospace' }}>
            {stat.label}
          </div>
          <div className="text-foreground text-2xl font-semibold" style={{ fontFamily: 'FK Grotesk Mono, monospace' }}>
            {stat.value}
          </div>
          {stat.subtext && (
            <div className="text-muted-foreground/60 text-xs mt-2" style={{ fontFamily: 'FK Grotesk Mono, monospace' }}>
              {stat.subtext}
            </div>
          )}
        </div>
        <div className={`${stat.bgColor} ${stat.color} p-2 rounded-lg`}>
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
});

StatCard.displayName = 'StatCard';

function AdminStatsComponent({
  submissions,
  isLoading = false,
  autoRefresh = false,
  refreshInterval = 30000,
  onRefresh,
}: AdminStatsProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Auto-refresh logic
  useEffect(() => {
    if (!autoRefresh || !onRefresh) return;

    const interval = setInterval(async () => {
      try {
        await onRefresh();
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, onRefresh]);

  const handleManualRefresh = useCallback(async () => {
    if (!onRefresh || isRefreshing) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Manual refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, isRefreshing]);

  // Memoized calculations
  const stats = useMemo(() => {
    const totalSubmissions = submissions.length;
    const completedCount = submissions.filter(s => s.status === 'completed').length;
    const pendingCount = submissions.filter(s => s.status === 'pending' || s.status === 'in_progress').length;
    const completionRate = totalSubmissions > 0
      ? Math.round((completedCount / totalSubmissions) * 100)
      : 0;

    // Calculate time-based metrics
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

    const last24Hours = submissions.filter(s => s.createdAt > oneDayAgo).length;
    const last7Days = submissions.filter(s => s.createdAt > sevenDaysAgo).length;
    const last30Days = submissions.filter(s => s.createdAt > thirtyDaysAgo).length;

    // Average submissions per day (last 30 days)
    const avgPerDay = totalSubmissions > 0 && submissions.some(s => s.createdAt > thirtyDaysAgo)
      ? Math.round((last30Days / 30) * 10) / 10
      : 0;

    const statData: Stat[] = [
      {
        label: 'Total Requests',
        value: totalSubmissions,
        icon: Users,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        subtext: last7Days > 0 ? `+${last7Days} in last 7 days` : undefined,
      },
      {
        label: 'Pending',
        value: pendingCount,
        icon: Clock,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        subtext: pendingCount > 0 ? 'Requires attention' : 'All clear',
      },
      {
        label: 'Completed',
        value: completedCount,
        icon: CheckCircle2,
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        subtext: completedCount > 0 ? `${completionRate}% completion rate` : undefined,
      },
      {
        label: 'Activity Rate',
        value: avgPerDay > 0 ? `${avgPerDay}/day` : '0/day',
        icon: TrendingUp,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        subtext: last24Hours > 0 ? `${last24Hours} in last 24h` : 'No recent activity',
      },
    ];

    return statData;
  }, [submissions]);

  const formattedLastUpdated = useMemo(() => {
    return lastUpdated.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, [lastUpdated]);

  return (
    <div className="space-y-4">
      {onRefresh && (
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground/60 text-xs" style={{ fontFamily: 'FK Grotesk Mono, monospace' }}>
            Last updated: {formattedLastUpdated}
          </div>
          <Button
            onClick={handleManualRefresh}
            disabled={isRefreshing || isLoading}
            variant="ghost"
            size="sm"
            className="h-8"
            style={{ fontFamily: 'FK Grotesk Mono, monospace' }}
          >
            <RefreshCw className={`w-3 h-3 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} isLoading={isLoading} />
        ))}
      </div>

      {submissions.length === 0 && !isLoading && (
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <div className="text-muted-foreground mb-2" style={{ fontFamily: 'FK Grotesk Mono, monospace' }}>
            No submission data available
          </div>
          <div className="text-muted-foreground/60 text-sm" style={{ fontFamily: 'FK Grotesk Mono, monospace' }}>
            Statistics will appear here once submissions are received
          </div>
        </div>
      )}
    </div>
  );
}

export const AdminStats = memo(AdminStatsComponent);
