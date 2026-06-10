import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { GearLoader } from './gear-loader';

describe('GearLoader', () => {
  it('renders with default medium size', () => {
    const { container } = render(<GearLoader aria-label="Loading" />);
    const svg = container.querySelector('[data-slot="gear-loader"]');
    expect(svg).toHaveClass('h-6', 'w-6');
  });

  it('supports size variants', () => {
    const { container, rerender } = render(<GearLoader size="sm" aria-label="Loading" />);
    expect(container.querySelector('[data-slot="gear-loader"]')).toHaveClass('h-4', 'w-4');

    rerender(<GearLoader size="lg" aria-label="Loading" />);
    expect(container.querySelector('[data-slot="gear-loader"]')).toHaveClass('h-10', 'w-10');
  });

  it('exposes accessible name when standalone', () => {
    render(<GearLoader aria-label="Loading machinery data" />);
    expect(screen.getByRole('img', { name: 'Loading machinery data' })).toBeInTheDocument();
  });

  it('is decorative when aria-hidden is true', () => {
    const { container } = render(<GearLoader aria-hidden />);
    const svg = container.querySelector('[data-slot="gear-loader"]');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).not.toHaveAttribute('role');
  });

  it('applies counter-rotating animation classes with reduced-motion fallback', () => {
    const { container } = render(<GearLoader aria-hidden />);
    const groups = container.querySelectorAll('g');
    expect(groups[0]).toHaveClass('animate-gear-cw', 'motion-reduce:animate-none');
    expect(groups[1]).toHaveClass('animate-gear-ccw', 'motion-reduce:animate-none');
  });

  it('accepts className override', () => {
    const { container } = render(<GearLoader className="text-primary" aria-hidden />);
    expect(container.querySelector('[data-slot="gear-loader"]')).toHaveClass('text-primary');
  });
});
