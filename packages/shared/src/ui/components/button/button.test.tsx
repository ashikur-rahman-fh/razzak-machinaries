import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('cursor-pointer');
  });

  it('uses not-allowed cursor when disabled', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toHaveClass('disabled:cursor-not-allowed');
  });

  it('supports variants', () => {
    const { rerender } = render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-destructive');

    rerender(<Button variant="success">Save</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-success');
  });

  it('supports disabled state', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('uses dedicated disabled colors for primary variant', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('disabled:bg-primary-disabled');
    expect(button).toHaveClass('disabled:text-primary-disabled-foreground');
    expect(button).not.toHaveClass('disabled:opacity-50');
  });

  it('supports custom className', () => {
    render(<Button className="custom-class">Styled</Button>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('supports click handler', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await user.click(screen.getByRole('button', { name: 'Click' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('sets data-slot="button" on native button elements', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toHaveAttribute('data-slot', 'button');
  });

  it('sets data-slot="button" when rendered asChild with an anchor', () => {
    render(
      <Button asChild>
        <a href="/change-password">Change password</a>
      </Button>,
    );
    expect(screen.getByRole('link', { name: 'Change password' })).toHaveAttribute(
      'data-slot',
      'button',
    );
  });
});
