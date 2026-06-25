import { cn } from '../../utils/cn';

export const BRAND_LOGO_PATH = '/brand/rms-logo-main.jpg';
export const BRAND_LOGO_ALT = 'Razzak Machinaries';

export type BrandLogoSize = 'navbar' | 'login';

const sizeClasses: Record<BrandLogoSize, string> = {
  navbar: 'h-16 w-auto max-w-[min(100%,20rem)]',
  login: 'h-32 w-auto max-w-[min(100%,28rem)]',
};

export type BrandLogoProps = {
  size?: BrandLogoSize;
  className?: string;
};

export function getBrandLogoSrc(basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''): string {
  return `${basePath}${BRAND_LOGO_PATH}`;
}

export function BrandLogo({ size = 'navbar', className }: BrandLogoProps) {
  return (
    <img
      src={getBrandLogoSrc()}
      alt={BRAND_LOGO_ALT}
      width={1024}
      height={1024}
      className={cn('block shrink-0 object-contain', sizeClasses[size], className)}
      decoding="async"
    />
  );
}
