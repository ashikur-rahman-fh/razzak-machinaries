import { afterEach, describe, expect, it } from 'vitest';

import {
  applyDocumentDisplayMode,
  applyDocumentLanguagePreference,
} from './language-preference';

describe('applyDocumentDisplayMode', () => {
  afterEach(() => {
    delete document.documentElement.dataset.contentDisplay;
    document.documentElement.lang = 'en';
  });

  it('sets data-content-display on the document element', () => {
    applyDocumentDisplayMode('both');
    expect(document.documentElement.dataset.contentDisplay).toBe('both');
  });

  it('updates data-content-display when display mode changes', () => {
    applyDocumentDisplayMode('en');
    expect(document.documentElement.dataset.contentDisplay).toBe('en');

    applyDocumentDisplayMode('bn');
    expect(document.documentElement.dataset.contentDisplay).toBe('bn');
  });
});

describe('applyDocumentLanguagePreference', () => {
  afterEach(() => {
    delete document.documentElement.dataset.contentDisplay;
    document.documentElement.lang = 'en';
  });

  it('sets lang and data-content-display together', () => {
    applyDocumentLanguagePreference({ language: 'bn', displayMode: 'both' });
    expect(document.documentElement.lang).toBe('bn');
    expect(document.documentElement.dataset.contentDisplay).toBe('both');
  });
});
