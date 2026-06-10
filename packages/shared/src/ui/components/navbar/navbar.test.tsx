import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Navbar } from './navbar';

describe('Navbar', () => {
  const items = [
    { label: 'Home', href: '/', active: true },
    { label: 'Dashboard', href: '/dashboard' },
  ];

  it('renders app name', () => {
    render(<Navbar appName="Main App" items={items} />);
    expect(screen.getByLabelText('Main App navigation')).toBeInTheDocument();
    expect(screen.getByText('Main App')).toBeInTheDocument();
  });

  it('renders nav items', () => {
    render(<Navbar appName="Main App" items={items} />);
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('marks active item correctly', () => {
    render(<Navbar appName="Main App" items={items} />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
  });

  it('supports actions area', () => {
    render(
      <Navbar appName="Main App" items={items} actions={<button type="button">Sign in</button>} />,
    );
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('has accessible mobile menu trigger', () => {
    render(<Navbar appName="Main App" items={items} />);
    expect(screen.getByRole('button', { name: 'Open navigation menu' })).toBeInTheDocument();
  });

  it('centers nav link labels in the anchor container', () => {
    render(<Navbar appName="Main App" items={items} />);
    const homeLink = screen.getByRole('link', { name: 'Home' });
    expect(homeLink).toHaveClass('items-center', 'text-center');
  });

  it('renders menu description for accessibility when provided', async () => {
    const user = userEvent.setup();
    render(
      <Navbar
        appName="Main App"
        items={items}
        menuDescription="Open navigation menu"
        closeMenuLabel="Close menu"
        openMenuLabel="Open menu"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(screen.getByText('Open navigation menu')).toBeInTheDocument();
  });

  it('renders actions in mobile drawer when menu is open', async () => {
    const user = userEvent.setup();
    render(
      <Navbar
        appName="Main App"
        items={items}
        actions={<button type="button">Sign out</button>}
        openMenuLabel="Open menu"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    const signOutButtons = screen.getAllByRole('button', { name: 'Sign out' });
    expect(signOutButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('hides header actions on mobile viewport class', () => {
    render(
      <Navbar
        appName="Main App"
        items={items}
        actions={<button type="button">Sign in</button>}
      />,
    );
    const headerActions = screen.getAllByRole('button', { name: 'Sign in' })[0].parentElement;
    expect(headerActions).toHaveClass('hidden', 'sm:flex');
  });
});
