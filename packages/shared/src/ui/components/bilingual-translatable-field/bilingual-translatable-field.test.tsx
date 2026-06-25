import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BilingualTranslatableField } from './bilingual-translatable-field';

vi.mock('../../../api/admin-translations', () => ({
  adminTranslationsApi: {
    translate: vi.fn(),
  },
}));

describe('BilingualTranslatableField', () => {
  it('forwards required semantics to Bangla and English inputs', () => {
    render(
      <BilingualTranslatableField
        label="Full name"
        bnValue=""
        enValue=""
        onBnChange={() => undefined}
        onEnChange={() => undefined}
        required
      />,
    );

    expect(screen.getByTestId('Full name-bn-input')).toHaveAttribute('required');
    expect(screen.getByTestId('Full name-bn-input')).toHaveAttribute('aria-required', 'true');
    expect(screen.getByTestId('Full name-en-input')).toHaveAttribute('required');
    expect(screen.getByTestId('Full name-en-input')).toHaveAttribute('aria-required', 'true');
  });
});
