import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../src/components/ui/Button.js';
import { Input } from '../../src/components/ui/Input.js';
import { Modal } from '../../src/components/ui/Modal.js';
import { Badge } from '../../src/components/ui/Badge.js';
import { ProgressBar } from '../../src/components/ui/ProgressBar.js';
import { EmptyState } from '../../src/components/feedback/EmptyState.js';

describe('CloudVault Web UI Component Library', () => {
  describe('Button Component', () => {
    it('renders with children and handles clicks', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);
      const btn = screen.getByRole('button', { name: /click me/i });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('displays loading spinner and disables button when isLoading is true', () => {
      render(<Button isLoading>Submit</Button>);
      const btn = screen.getByRole('button');
      expect(btn).toBeDisabled();
    });
  });

  describe('Input Component', () => {
    it('renders label, input, and updates value', () => {
      const handleChange = vi.fn();
      render(<Input label="Master Password" placeholder="Secret" onChange={handleChange} />);
      expect(screen.getByText('Master Password')).toBeInTheDocument();
      const input = screen.getByPlaceholderText('Secret');
      fireEvent.change(input, { target: { value: 'MySecretPassword123' } });
      expect(handleChange).toHaveBeenCalled();
    });

    it('toggles password visibility when isPassword is true', () => {
      render(<Input label="Password" isPassword placeholder="Enter password" />);
      const input = screen.getByPlaceholderText('Enter password');
      expect(input).toHaveAttribute('type', 'password');

      // Click eye button
      const toggleBtn = screen.getByRole('button');
      fireEvent.click(toggleBtn);
      expect(input).toHaveAttribute('type', 'text');
    });
  });

  describe('Modal Component', () => {
    it('renders title, description and children when isOpen is true', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal" description="Modal Description">
          <p>Modal Body Content</p>
        </Modal>
      );
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal Description')).toBeInTheDocument();
      expect(screen.getByText('Modal Body Content')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(
        <Modal isOpen={false} onClose={() => {}} title="Hidden Modal">
          <p>Hidden Content</p>
        </Modal>
      );
      expect(screen.queryByText('Hidden Modal')).not.toBeInTheDocument();
    });
  });

  describe('Badge & ProgressBar', () => {
    it('renders badge with correct text', () => {
      render(<Badge variant="teal">E2EE Protected</Badge>);
      expect(screen.getByText('E2EE Protected')).toBeInTheDocument();
    });

    it('renders progress bar with correct clamped width', () => {
      const { container } = render(<ProgressBar progress={75} showLabel />);
      expect(screen.getByText('75%')).toBeInTheDocument();
      const fill = container.querySelector('[style*="width: 75%"]');
      expect(fill).toBeInTheDocument();
    });
  });

  describe('EmptyState Component', () => {
    it('renders title, description and triggers action button', () => {
      const handleAction = vi.fn();
      render(
        <EmptyState
          title="Folder is Empty"
          description="Drop files here to encrypt"
          actionLabel="Upload Now"
          onAction={handleAction}
        />
      );
      expect(screen.getByText('Folder is Empty')).toBeInTheDocument();
      const actionBtn = screen.getByRole('button', { name: /upload now/i });
      fireEvent.click(actionBtn);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });
  });
});

