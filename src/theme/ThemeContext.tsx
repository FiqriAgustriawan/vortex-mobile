import React, { createContext, useContext, useState, ReactNode } from 'react';

// Theme Colors Interface
export interface ThemeColors {
  // Base
  primary: string;
  primaryLight: string;
  background: string;
  surface: string;
  surfaceSecondary: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;

  // Borders & Dividers
  border: string;
  divider: string;

  // Status
  online: string;
  offline: string;
  error: string;
  warning: string;
  success: string;

  // Chat Bubbles
  userBubble: string;
  userBubbleText: string;
  aiBubble: string;
  aiBubbleText: string;

  // Badges
  badgeFastest: string;
  badgeRecommended: string;
  badgeMultimodal: string;
}

// Light Theme - Clean & Professional
const lightColors: ThemeColors = {
  primary: '#fe591b',
  primaryLight: '#ff7a45',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F3F5',

  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',

  border: '#E5E7EB',
  divider: '#F3F4F6',

  online: '#10B981',
  offline: '#6B7280',
  error: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',

  userBubble: '#fe591b',
  userBubbleText: '#FFFFFF',
  aiBubble: '#FFFFFF',
  aiBubbleText: '#1A1A2E',

  badgeFastest: '#10B981',
  badgeRecommended: '#fe591b',
  badgeMultimodal: '#3B82F6',
};

// Dark Theme - Modern & Sleek
const darkColors: ThemeColors = {
  primary: '#fe591b',
  primaryLight: '#ff7a45',
  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceSecondary: '#252542',

  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',

  border: '#374151',
  divider: '#1F2937',

  online: '#34D399',
  offline: '#6B7280',
  error: '#F87171',
  warning: '#FBBF24',
  success: '#34D399',

  userBubble: '#fe591b',
  userBubbleText: '#FFFFFF',
  aiBubble: '#1A1A2E',
  aiBubbleText: '#F9FAFB',

  badgeFastest: '#34D399',
  badgeRecommended: '#fe591b',
  badgeMultimodal: '#60A5FA',
};

// Theme Context Interface
interface ThemeContextType {
  colors: ThemeColors;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

// Create Context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme Provider Component
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ colors, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom Hook to use Theme
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
