'use client';

import { Menu } from 'lucide-react';
import * as React from 'react';

import { Button } from '../button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../../primitives/shadcn/sheet';
import { cn } from '../../utils/cn';

export type NavbarItem = {
  label: React.ReactNode;
  href: string;
  active?: boolean;
};

const brandClassName =
  'font-display text-base font-medium leading-snug tracking-tight text-foreground';

export type NavbarProps = {
  appName: React.ReactNode;
  logo?: React.ReactNode;
  homeHref?: string;
  items: NavbarItem[];
  actions?: React.ReactNode;
  navigationLabel?: string;
  openMenuLabel?: string;
  closeMenuLabel?: string;
  menuDescription?: string;
  className?: string;
};

function NavLinks({
  items,
  className,
  onNavigate,
}: {
  items: NavbarItem[];
  className?: string;
  onNavigate?: () => void;
}) {
  return (
    <ul
      className={cn(
        'flex flex-col gap-1 lg:flex-row lg:items-center lg:justify-center lg:gap-1',
        className,
      )}
    >
      {items.map((item) => (
        <li key={item.href} className="w-full lg:w-auto">
          <a
            href={item.href}
            data-nav-link
            aria-current={item.active ? 'page' : undefined}
            onClick={onNavigate}
            className={cn(
              'inline-flex w-full min-h-9 cursor-pointer flex-col items-center justify-center rounded-md px-3 py-1.5 text-center text-sm font-medium transition-colors duration-150 lg:w-auto',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              item.active
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
            )}
          >
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function Navbar({
  appName,
  logo,
  homeHref = '/',
  items,
  actions,
  navigationLabel,
  openMenuLabel = 'Open navigation menu',
  closeMenuLabel = 'Close',
  menuDescription,
  className,
}: NavbarProps) {
  const navAriaLabel =
    navigationLabel ?? (typeof appName === 'string' ? `${appName} navigation` : 'Site navigation');
  const [open, setOpen] = React.useState(false);

  function closeDrawer() {
    setOpen(false);
  }

  function enhanceDrawerActions(node: React.ReactNode): React.ReactNode {
    const wrapClick =
      (handler?: React.MouseEventHandler) => (event: React.MouseEvent<HTMLElement>) => {
        handler?.(event);
        if ((event.target as HTMLElement).closest('button, a[href]')) {
          closeDrawer();
        }
      };

    return React.Children.map(node, (child) => {
      if (
        !React.isValidElement<{ children?: React.ReactNode; onClick?: React.MouseEventHandler }>(
          child,
        )
      ) {
        return child;
      }

      const enhancedChildren = React.Children.map(child.props.children, (inner) => {
        if (!React.isValidElement<{ onClick?: React.MouseEventHandler }>(inner)) {
          return inner;
        }
        return React.cloneElement(inner, { onClick: wrapClick(inner.props.onClick) });
      });

      return React.cloneElement(child, { children: enhancedChildren });
    });
  }

  return (
    <header className={cn('sticky top-0 z-40 border-b border-border bg-card', className)}>
      <nav
        aria-label={navAriaLabel}
        className="relative mx-auto flex min-h-14 h-auto max-w-6xl items-center justify-between gap-4 px-4 py-2 sm:px-6"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {logo ?? (
            <a
              href={homeHref}
              data-navbar-brand
              className={cn(
                brandClassName,
                'max-w-[min(100%,12rem)] truncate lg:max-w-none',
                'rounded-sm transition-colors duration-150 hover:text-foreground/90',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              )}
            >
              {appName}
            </a>
          )}
        </div>

        <div className="navbar-desktop-nav pointer-events-none absolute inset-x-0 hidden justify-center lg:flex">
          <div className="pointer-events-auto">
            <NavLinks items={items} />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          {actions ? (
            <div className="navbar-header-actions hidden items-center gap-2 lg:flex">{actions}</div>
          ) : null}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="navbar-mobile-trigger lg:hidden">
              <Button variant="outline" size="sm" aria-label={openMenuLabel}>
                <Menu className="h-4 w-4" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(100%,20rem)]" closeLabel={closeMenuLabel}>
              <SheetHeader>
                <SheetTitle className="font-display">{appName}</SheetTitle>
                {menuDescription ? (
                  <SheetDescription className="sr-only">{menuDescription}</SheetDescription>
                ) : null}
              </SheetHeader>
              <NavLinks items={items} className="mt-6" onNavigate={closeDrawer} />
              {actions ? (
                <div className="mt-6 flex flex-col gap-3 border-t border-border pt-4 lg:hidden">
                  {enhanceDrawerActions(actions)}
                </div>
              ) : null}
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
