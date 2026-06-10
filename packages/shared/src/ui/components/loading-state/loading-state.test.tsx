import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LoadingState } from './loading-state';

describe('LoadingState', () => {
  it('renders status text with default label', () => {
    render(<LoadingState />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
  });

  it('renders custom label text', () => {
    render(<LoadingState label="Please wait" />);
    expect(screen.getByText('Please wait')).toBeInTheDocument();
  });

  it('uses inline pill layout by default', () => {
    render(<LoadingState label="Please wait" />);
    const status = screen.getByRole('status');
    expect(status).toHaveClass('inline-flex', 'border', 'bg-card');
  });

  it('uses fullscreen centered layout without pill styling', () => {
    render(
      <LoadingState layout="fullscreen" label="Checking session" data-testid="auth-loading" />,
    );
    expect(screen.getByTestId('auth-loading')).toHaveAttribute('aria-busy', 'true');
    const status = screen.getByRole('status');
    expect(status).toHaveClass('flex-col', 'items-center');
    expect(status).not.toHaveClass('border');
  });

  it('renders gear loader instead of lucide spinner', () => {
    const { container } = render(<LoadingState label="Please wait" />);
    expect(container.querySelector('[data-slot="gear-loader"]')).toBeInTheDocument();
    expect(container.querySelector('svg.lucide-loader2')).not.toBeInTheDocument();
  });

  it('hides gear svg from assistive tech inside labeled status', () => {
    const { container } = render(<LoadingState label="Please wait" />);
    const gear = container.querySelector('[data-slot="gear-loader"]');
    expect(gear).toHaveAttribute('aria-hidden', 'true');
  });
});
