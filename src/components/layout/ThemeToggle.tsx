/**
 * ThemeToggle Component
 * Toggle between light and dark themes
 */

import { Sun } from 'lucide-react';
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
      className="w-8 h-8 md:w-12 md:h-12 p-0 bg-transparent hover:bg-transparent text-muted-foreground hover:text-foreground"
    >
      <Sun className="h-8 w-8 md:h-12 md:w-12 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <svg className="absolute h-8 w-8 md:h-12 md:w-12 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 66.39 67.63" fill="currentColor">
        <path d="M33.62,34.83c-5.68-5.68-7.12-13.99-4.34-21.02-2.87.92-5.57,2.5-7.84,4.77-7.62,7.62-7.63,19.99,0,27.61,7.63,7.63,19.99,7.62,27.61,0,1.94-1.94,3.38-4.19,4.34-6.6-6.74,2.16-14.42.58-19.77-4.77Z"/>
      </svg>
    </Button>
  );
}
