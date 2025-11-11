/**
 * Header Component
 * Main navigation header
 */

import { Link } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/contexts/AppContext';
import { Home, Image, BookOpen, LogOut } from 'lucide-react';

export function Header() {
  const { isAdmin, logout } = useApp();

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-medium text-lg">
            Drawing Tool
          </Link>

          <nav className="hidden md:flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
            <Link to="/gallery">
              <Button variant="ghost" size="sm">
                <Image className="h-4 w-4 mr-2" />
                Gallery
              </Button>
            </Link>
            <Link to="/prompts">
              <Button variant="ghost" size="sm">
                <BookOpen className="h-4 w-4 mr-2" />
                Prompts
              </Button>
            </Link>
            {isAdmin && (
              <>
                <Link to="/admin/draw">
                  <Button variant="ghost" size="sm">
                    Admin Draw
                  </Button>
                </Link>
                <Link to="/admin/approvals">
                  <Button variant="ghost" size="sm">
                    Approvals
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
