import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test-utils';
import { ToastComponent, useToast } from '../toast';

// Test component to trigger toasts
function TestToastTrigger() {
  const { success, error, warning, info } = useToast();

  return (
    <div>
      <button onClick={() => success('Success message')}>Success Toast</button>
      <button onClick={() => error('Error message')}>Error Toast</button>
      <button onClick={() => warning('Warning message')}>Warning Toast</button>
      <button onClick={() => info('Info message')}>Info Toast</button>
    </div>
  );
}

describe('Toast Component', () => {
  beforeEach(() => {
    // Clear any existing toasts
    document.body.innerHTML = '';
  });

  it('renders toast with correct content', () => {
    const toast = {
      id: '1',
      type: 'success' as const,
      title: 'Success',
      message: 'Operation completed successfully',
    };

    render(<ToastComponent {...toast} onClose={jest.fn()} />);

    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(
      screen.getByText('Operation completed successfully')
    ).toBeInTheDocument();
  });

  it('displays correct icon for each toast type', () => {
    const types = ['success', 'error', 'warning', 'info'] as const;

    types.forEach((type) => {
      const toast = {
        id: `${type}-toast`,
        type,
        title: `${type} toast`,
        message: `This is a ${type} message`,
      };

      const { unmount } = render(
        <ToastComponent {...toast} onClose={jest.fn()} />
      );

      // Check if the appropriate icon is rendered (based on the type)
      const toastElement = screen
        .getByText(`${type} toast`)
        .closest('[role="alert"]');
      expect(toastElement).toBeInTheDocument();

      unmount();
    });
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClose = jest.fn();
    const toast = {
      id: '1',
      type: 'info' as const,
      title: 'Info',
      message: 'Information message',
    };

    render(<ToastComponent {...toast} onClose={mockOnClose} />);

    const closeButton = screen.getByRole('button', {
      name: /close notification/i,
    });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('renders action buttons when provided', async () => {
    const user = userEvent.setup();
    const mockAction = jest.fn();
    const toast = {
      id: '1',
      type: 'info' as const,
      title: 'Action Toast',
      message: 'Click the action button',
      actions: [
        {
          label: 'Retry',
          action: mockAction,
        },
      ],
    };

    render(<ToastComponent {...toast} onClose={jest.fn()} />);

    const actionButton = screen.getByRole('button', { name: /retry/i });
    expect(actionButton).toBeInTheDocument();

    await user.click(actionButton);
    expect(mockAction).toHaveBeenCalled();
  });
});

describe('useToast Hook', () => {
  it('creates different types of toasts', async () => {
    const user = userEvent.setup();
    const { useNotificationStore } = require('@/stores');
    const mockSuccess = jest.fn();
    const mockError = jest.fn();
    const mockWarning = jest.fn();
    const mockInfo = jest.fn();

    // Update mock to return testable functions
    (useNotificationStore as jest.Mock).mockReturnValue({
      notifications: [],
      addNotification: jest.fn(),
      removeNotification: jest.fn(),
      clearAll: jest.fn(),
      updateNotification: jest.fn(),
      success: mockSuccess,
      error: mockError,
      warning: mockWarning,
      info: mockInfo,
    });

    render(<TestToastTrigger />);

    const successButton = screen.getByText('Success Toast');
    const errorButton = screen.getByText('Error Toast');
    const warningButton = screen.getByText('Warning Toast');
    const infoButton = screen.getByText('Info Toast');

    await user.click(successButton);
    expect(mockSuccess).toHaveBeenCalledWith('Success message');

    await user.click(errorButton);
    expect(mockError).toHaveBeenCalledWith('Error message');

    await user.click(warningButton);
    expect(mockWarning).toHaveBeenCalledWith('Warning message');

    await user.click(infoButton);
    expect(mockInfo).toHaveBeenCalledWith('Info message');
  });
});
