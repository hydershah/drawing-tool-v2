/**
 * ThemeToggle Component
 * Toggle between light and dark themes
 */

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/Button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <Button
      variant="ghost"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="w-10 h-10 md:w-16 md:h-16 rounded-full p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
    >
      <Sun className="h-5 w-5 md:h-8 md:w-8 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 md:h-8 md:w-8 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
