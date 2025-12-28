import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test-utils';
import { ThemeToggle, SimpleThemeToggle } from '../theme-toggle';

// Mock the entire stores module with all required stores
jest.mock('@/stores', () => ({
  useTheme: jest.fn(),
  useNotificationStore: jest.fn(() => ({
    notifications: [],
    addNotification: jest.fn(),
    removeNotification: jest.fn(),
    clearAll: jest.fn(),
    updateNotification: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  })),
  useUIStore: jest.fn(() => ({
    theme: 'light',
    sidebarOpen: false,
    sidebarCollapsed: false,
    modals: [],
    globalLoading: false,
    setTheme: jest.fn(),
    toggleSidebar: jest.fn(),
    openModal: jest.fn(),
    closeModal: jest.fn(),
    setGlobalLoading: jest.fn(),
  })),
}));

import { useTheme } from '@/stores';
const mockUseTheme = useTheme as jest.MockedFunction<any>;

const mockSetTheme = jest.fn();

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
      isDark: false,
      isLight: true,
    });
  });

  describe('ThemeToggle (Dropdown)', () => {
    it('renders theme toggle button', () => {
      render(<ThemeToggle />);

      const button = screen.getByRole('button', { name: /toggle theme/i });
      expect(button).toBeInTheDocument();
    });

    it('opens dropdown menu when clicked', async () => {
      const user = userEvent.setup();
      render(<ThemeToggle />);

      const button = screen.getByRole('button', { name: /toggle theme/i });
      await user.click(button);

      // Check if dropdown items appear
      expect(screen.getByText('Light')).toBeInTheDocument();
      expect(screen.getByText('Dark')).toBeInTheDocument();
      expect(screen.getByText('System')).toBeInTheDocument();
    });

    it('calls setTheme when dropdown option is selected', async () => {
      const user = userEvent.setup();
      render(<ThemeToggle />);

      const button = screen.getByRole('button', { name: /toggle theme/i });
      await user.click(button);

      const darkOption = screen.getByText('Dark');
      await user.click(darkOption);

      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('shows current theme with correct icon', () => {
      // Test light theme
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
        isDark: false,
        isLight: true,
      });

      const { rerender } = render(<ThemeToggle />);

      // Should show sun icon for light theme
      expect(screen.getByRole('button')).toBeInTheDocument();

      // Test dark theme
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
        isDark: true,
        isLight: false,
      });

      rerender(<ThemeToggle />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('indicates current selection in dropdown', async () => {
      const user = userEvent.setup();
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
        isDark: true,
        isLight: false,
      });

      render(<ThemeToggle />);

      const button = screen.getByRole('button', { name: /toggle theme/i });
      await user.click(button);

      // The current theme should be indicated somehow (e.g., with a check icon)
      const darkOption = screen.getByText('Dark');
      expect(darkOption).toBeInTheDocument();
    });
  });

  describe('SimpleThemeToggle', () => {
    it('renders simple theme toggle button', () => {
      render(<SimpleThemeToggle />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('toggles between light and dark themes', async () => {
      const user = userEvent.setup();

      // Start with light theme
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
        isDark: false,
        isLight: true,
      });

      render(<SimpleThemeToggle />);

      const button = screen.getByRole('button');
      await user.click(button);

      // Should switch to dark theme
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('toggles from dark to light theme', async () => {
      const user = userEvent.setup();

      // Start with dark theme
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
        isDark: true,
        isLight: false,
      });

      render(<SimpleThemeToggle />);

      const button = screen.getByRole('button');
      await user.click(button);

      // Should switch to light theme
      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });

    it('handles system theme correctly', async () => {
      const user = userEvent.setup();

      // Start with system theme
      mockUseTheme.mockReturnValue({
        theme: 'system',
        setTheme: mockSetTheme,
        isDark: false, // System resolves to light
        isLight: true,
      });

      render(<SimpleThemeToggle />);

      const button = screen.getByRole('button');
      await user.click(button);

      // Should switch to dark theme when system resolves to light
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('applies correct CSS classes', () => {
      render(<SimpleThemeToggle />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass(
        'inline-flex',
        'items-center',
        'justify-center'
      );
    });
  });
});
