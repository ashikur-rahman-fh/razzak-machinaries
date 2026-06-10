import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../utils/cn';

const gearLoaderVariants = cva('shrink-0 motion-reduce:animate-pulse', {
  variants: {
    size: {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-10 w-10',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const LARGE_GEAR_PATH =
  'M 10.000 8.800 L 12.117 9.118 L 11.588 10.839 L 12.527 11.228 L 13.369 9.637 L 15.091 10.909 L 16.363 12.631 L 14.772 13.473 L 15.161 14.412 L 16.882 13.883 L 17.200 16.000 L 16.882 18.117 L 15.161 17.588 L 14.772 18.527 L 16.363 19.369 L 15.091 21.091 L 13.369 22.363 L 12.527 20.772 L 11.588 21.161 L 12.117 22.882 L 10.000 23.200 L 7.883 22.882 L 8.412 21.161 L 7.473 20.772 L 6.631 22.363 L 4.909 21.091 L 3.637 19.369 L 5.228 18.527 L 4.839 17.588 L 3.118 18.117 L 2.800 16.000 L 3.118 13.883 L 4.839 14.412 L 5.228 13.473 L 3.637 12.631 L 4.909 10.909 L 6.631 9.637 L 7.473 11.228 L 8.412 10.839 L 7.883 9.118 Z M 10 13.8 a 2.2 2.2 0 1 0 0 4.4 a 2.2 2.2 0 1 0 0 -4.4';

const SMALL_GEAR_PATH =
  'M 22.500 10.800 L 24.515 11.206 L 23.973 12.497 L 24.797 12.973 L 25.644 11.858 L 27.003 13.400 L 27.659 15.348 L 26.270 15.524 L 26.270 16.476 L 27.659 16.652 L 27.003 18.600 L 25.644 20.142 L 24.797 19.027 L 23.973 19.503 L 24.515 20.794 L 22.500 21.200 L 20.485 20.794 L 21.027 19.503 L 20.203 19.027 L 19.356 20.142 L 17.997 18.600 L 17.341 16.652 L 18.730 16.476 L 18.730 15.524 L 17.341 15.348 L 17.997 13.400 L 19.356 11.858 L 20.203 12.973 L 21.027 12.497 L 20.485 11.206 Z M 22.5 14.4 a 1.6 1.6 0 1 0 0 3.2 a 1.6 1.6 0 1 0 0 -3.2';

export type GearLoaderSize = NonNullable<VariantProps<typeof gearLoaderVariants>['size']>;

export type GearLoaderProps = {
  className?: string;
  'aria-label'?: string;
  'aria-hidden'?: boolean;
} & VariantProps<typeof gearLoaderVariants>;

export function GearLoader({
  size,
  className,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
}: GearLoaderProps) {
  const isDecorative = ariaHidden ?? !ariaLabel;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      role={isDecorative ? undefined : 'img'}
      aria-label={isDecorative ? undefined : ariaLabel}
      aria-hidden={isDecorative ? true : undefined}
      data-slot="gear-loader"
      className={cn(gearLoaderVariants({ size }), className)}
    >
      <g
        className="motion-reduce:animate-none animate-gear-cw text-primary"
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      >
        <path d={LARGE_GEAR_PATH} fill="currentColor" fillRule="evenodd" />
      </g>
      <g
        className="motion-reduce:animate-none animate-gear-ccw text-muted-foreground"
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      >
        <path d={SMALL_GEAR_PATH} fill="currentColor" fillRule="evenodd" />
      </g>
    </svg>
  );
}

export { gearLoaderVariants };
