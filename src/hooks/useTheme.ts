import { useState, useEffect } from 'react';
import { DataService } from '../services/DataService';

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const dataService = DataService.getInstance();

  useEffect(() => {
    const savedTheme = dataService.getTheme();
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    dataService.saveTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return { theme, toggleTheme };
}