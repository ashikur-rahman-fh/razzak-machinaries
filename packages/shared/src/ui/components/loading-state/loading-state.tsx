import * as React from 'react';

import { GearLoader, type GearLoaderSize } from '../gear-loader';
import { cn } from '../../utils/cn';

export type LoadingStateLayout = 'inline' | 'fullscreen';

export type LoadingStateProps = {
  label?: React.ReactNode;
  className?: string;
  size?: GearLoaderSize;
  layout?: LoadingStateLayout;
  'data-testid'?: string;
};

export function LoadingState({
  label,
  className,
  size,
  layout = 'inline',
  'data-testid': dataTestId,
}: LoadingStateProps) {
  const displayLabel = label ?? 'Loading…';
  const gearSize = size ?? (layout === 'fullscreen' ? 'lg' : 'sm');
  const isFullscreen = layout === 'fullscreen';

  const content = (
    <>
      <GearLoader size={gearSize} aria-hidden />
      <span>{displayLabel}</span>
    </>
  );

  if (isFullscreen) {
    return (
      <div
        className="flex min-h-[50vh] items-center justify-center"
        data-testid={dataTestId}
        aria-busy="true"
      >
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'flex flex-col items-center gap-4 text-sm text-muted-foreground',
            className,
          )}
        >
          {content}
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-3 text-sm text-muted-foreground',
        className,
      )}
    >
      {content}
    </div>
  );
}
