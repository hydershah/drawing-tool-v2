/**
 * App Component
 * Main application with minimal fixed navigation
 */

import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { AppProvider, useApp } from './contexts/AppContext';
import { Logo } from './components/layout/Logo';
import { ThemeToggle } from './components/layout/ThemeToggle';
import { BookInfo } from './components/BookInfo';
import { AboutSidebar } from './components/layout/AboutSidebar';
import { Button } from './components/ui/Button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './components/ui/Tooltip';
import { HomePage } from './pages/HomePage';
import { GalleryPage } from './pages/GalleryPage';
import { PromptsPage } from './pages/PromptsPage';
import { UserDrawPage } from './pages/UserDrawPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDrawPage } from './pages/AdminDrawPage';
import { AdminApprovalsPage } from './pages/AdminApprovalsPage';
import { AdminPromptsPage } from './pages/AdminPromptsPage';
import { AdminContentPage } from './pages/AdminContentPage';
import {
  FileText,
  Grid3x3,
  Palette,
  LogOut,
  List,
  CheckSquare,
  Settings,
} from 'lucide-react';
import { useCallback, useState } from 'react';

/**
 * Navigation Button Component
 */
function NavButton({
  to,
  isActive,
  onClick,
  icon,
  tooltip,
  variant = 'default',
}: {
  to: string;
  isActive: boolean;
  onClick?: () => void;
  icon: React.ReactNode;
  tooltip: string;
  variant?: 'default' | 'destructive';
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(to);
    }
  };

  const buttonVariant = variant === 'destructive' ? 'ghost' : isActive ? 'default' : 'ghost';
  const className =
    variant === 'destructive'
      ? 'text-red-500 hover:text-red-600 hover:bg-red-500/10 w-10 h-10 md:w-16 md:h-16 rounded-full p-0'
      : isActive
      ? 'bg-primary text-primary-foreground w-10 h-10 md:w-16 md:h-16 rounded-full p-0'
      : 'text-muted-foreground hover:text-foreground hover:bg-accent w-10 h-10 md:w-16 md:h-16 rounded-full p-0';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button onClick={handleClick} variant={buttonVariant} className={className}>
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Fixed Navigation Component
 */
function FixedNav() {
  const { isAdmin, logout } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogoClick = useCallback(() => {
    // If on home page, toggle sidebar; otherwise navigate home
    if (location.pathname === '/') {
      setIsSidebarOpen(prev => !prev);
    } else {
      navigate('/');
    }
  }, [location.pathname, navigate]);

  return (
    <>
      {/* About Sidebar */}
      <AboutSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Logo in top-left */}
      <Logo onClick={handleLogoClick} isOpen={isSidebarOpen} />

      {/* Navigation icons in top-right */}
      <div className="fixed top-2 right-2 md:top-4 md:right-4 flex flex-wrap gap-1.5 md:gap-4 z-50 max-w-[calc(100vw-80px)] md:max-w-none justify-end">
        {/* Public navigation */}
        <NavButton
          to="/prompts"
          isActive={location.pathname === '/prompts'}
          icon={<FileText className="w-5 h-5 md:w-8 md:h-8" />}
          tooltip="Browse Prompts"
        />
        <NavButton
          to="/gallery"
          isActive={location.pathname === '/gallery'}
          icon={<Grid3x3 className="w-5 h-5 md:w-8 md:h-8" />}
          tooltip="Gallery"
        />

        {/* Admin navigation */}
        {isAdmin && (
          <>
            <NavButton
              to="/admin/prompts"
              isActive={location.pathname === '/admin/prompts'}
              icon={<List className="w-5 h-5 md:w-8 md:h-8" />}
              tooltip="Manage Prompts"
            />
            <NavButton
              to="/admin/approvals"
              isActive={location.pathname === '/admin/approvals'}
              icon={<CheckSquare className="w-5 h-5 md:w-8 md:h-8" />}
              tooltip="Approve Artworks"
            />
            <NavButton
              to="/admin/draw"
              isActive={location.pathname === '/admin/draw'}
              icon={<Palette className="w-5 h-5 md:w-8 md:h-8" />}
              tooltip="Draw"
            />
            <NavButton
              to="/admin/content"
              isActive={location.pathname === '/admin/content'}
              icon={<Settings className="w-5 h-5 md:w-8 md:h-8" />}
              tooltip="Site Content"
            />
            <NavButton
              to="/"
              isActive={false}
              onClick={logout}
              icon={<LogOut className="w-5 h-5 md:w-8 md:h-8" />}
              tooltip="Logout"
              variant="destructive"
            />
          </>
        )}
      </div>

      {/* Theme toggle in bottom-left */}
      <div className="fixed bottom-4 left-4 z-50">
        <ThemeToggle />
      </div>

      {/* Book info in bottom-right */}
      <BookInfo />
    </>
  );
}

/**
 * Protected route wrapper for admin pages
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useApp();

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}

/**
 * App routes with minimal layout
 */
function AppRoutes() {
  return (
    <div className="h-screen bg-background">
      <FixedNav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/prompts" element={<PromptsPage />} />
        <Route path="/user-draw" element={<UserDrawPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin/prompts"
          element={
            <ProtectedRoute>
              <AdminPromptsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/approvals"
          element={
            <ProtectedRoute>
              <AdminApprovalsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/draw"
          element={
            <ProtectedRoute>
              <AdminDrawPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/content"
          element={
            <ProtectedRoute>
              <AdminContentPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

/**
 * Main App with providers
 */
export function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <AppProvider>
          <BrowserRouter>
            <AppRoutes />
            <Toaster position="top-center" />
          </BrowserRouter>
        </AppProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
