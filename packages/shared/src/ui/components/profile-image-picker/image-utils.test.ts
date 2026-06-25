import { describe, expect, it } from 'vitest';

import { isAllowedImageType } from './image-utils';

describe('isAllowedImageType', () => {
  it('accepts supported image mime types', () => {
    expect(isAllowedImageType('image/jpeg')).toBe(true);
    expect(isAllowedImageType('image/png')).toBe(true);
    expect(isAllowedImageType('image/webp')).toBe(true);
  });

  it('rejects unsupported mime types', () => {
    expect(isAllowedImageType('text/plain')).toBe(false);
    expect(isAllowedImageType('application/pdf')).toBe(false);
  });
});
