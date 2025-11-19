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

  const className =
    variant === 'destructive'
      ? 'text-red-500 hover:text-red-600 w-8 h-8 md:w-12 md:h-12 p-0 bg-transparent hover:bg-transparent'
      : isActive
      ? 'text-foreground w-8 h-8 md:w-12 md:h-12 p-0 bg-transparent hover:bg-transparent'
      : 'text-muted-foreground hover:text-foreground w-8 h-8 md:w-12 md:h-12 p-0 bg-transparent hover:bg-transparent';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button onClick={handleClick} variant="ghost" className={className}>
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
      <div className="fixed top-2 right-2 md:top-4 md:right-4 flex flex-wrap gap-1.5 md:gap-4 z-[9999] max-w-[calc(100vw-80px)] md:max-w-none justify-end">
        {/* Public navigation */}
        <NavButton
          to="/prompts"
          isActive={location.pathname === '/prompts'}
          icon={
            <svg className="w-8 h-8 md:w-12 md:h-12" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 66.39 67.63" fill="currentColor">
              <rect x="20.25" y="14.09" width="30.88" height="1"/>
              <rect x="20.25" y="23.71" width="30.88" height="1"/>
              <rect x="20.25" y="33.34" width="30.88" height="1"/>
              <rect x="20.25" y="42.96" width="30.88" height="1"/>
              <rect x="20.25" y="52.59" width="30.88" height="1"/>
              <path d="M15.34,15.59h-.7c-.55,0-1-.45-1-1s.45-1,1-1h.7c.55,0,1,.45,1,1s-.45,1-1,1Z"/>
              <path d="M15.34,25.21h-.7c-.55,0-1-.45-1-1s.45-1,1-1h.7c.55,0,1,.45,1,1s-.45,1-1,1Z"/>
              <path d="M15.34,34.84h-.7c-.55,0-1-.45-1-1s.45-1,1-1h.7c.55,0,1,.45,1,1s-.45,1-1,1Z"/>
              <path d="M15.34,44.46h-.7c-.55,0-1-.45-1-1s.45-1,1-1h.7c.55,0,1,.45,1,1s-.45,1-1,1Z"/>
              <path d="M15.34,54.09h-.7c-.55,0-1-.45-1-1s.45-1,1-1h.7c.55,0,1,.45,1,1s-.45,1-1,1Z"/>
            </svg>
          }
          tooltip="Browse Prompts"
        />
        <NavButton
          to="/gallery"
          isActive={location.pathname === '/gallery'}
          icon={
            <svg className="w-8 h-8 md:w-12 md:h-12" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 66.39 67.63" fill="currentColor">
              <rect x="15.95" y="13.09" width="8.52" height="11.22"/>
              <rect x="28.17" y="13.09" width="8.52" height="11.22"/>
              <rect x="40.38" y="13.09" width="8.52" height="11.22"/>
              <rect x="15.95" y="27.9" width="8.52" height="11.22"/>
              <rect x="28.17" y="27.9" width="8.52" height="11.22"/>
              <rect x="40.38" y="27.9" width="8.52" height="11.22"/>
              <rect x="15.95" y="42.7" width="8.52" height="11.22"/>
              <rect x="28.17" y="42.7" width="8.52" height="11.22"/>
              <rect x="40.38" y="42.7" width="8.52" height="11.22"/>
            </svg>
          }
          tooltip="Gallery"
        />

        {/* Admin navigation */}
        {isAdmin && (
          <>
            <NavButton
              to="/admin/prompts"
              isActive={location.pathname === '/admin/prompts'}
              icon={<List className="w-8 h-8 md:w-12 md:h-12" />}
              tooltip="Manage Prompts"
            />
            <NavButton
              to="/admin/approvals"
              isActive={location.pathname === '/admin/approvals'}
              icon={<CheckSquare className="w-8 h-8 md:w-12 md:h-12" />}
              tooltip="Approve Artworks"
            />
            <NavButton
              to="/admin/draw"
              isActive={location.pathname === '/admin/draw'}
              icon={<Palette className="w-8 h-8 md:w-12 md:h-12" />}
              tooltip="Draw"
            />
            <NavButton
              to="/admin/content"
              isActive={location.pathname === '/admin/content'}
              icon={<Settings className="w-8 h-8 md:w-12 md:h-12" />}
              tooltip="Site Content"
            />
            <NavButton
              to="/"
              isActive={false}
              onClick={logout}
              icon={<LogOut className="w-8 h-8 md:w-12 md:h-12" />}
              tooltip="Logout"
              variant="destructive"
            />
          </>
        )}
      </div>

      {/* Theme toggle in bottom-left */}
      <div className="fixed bottom-4 left-4 z-[9999]">
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
