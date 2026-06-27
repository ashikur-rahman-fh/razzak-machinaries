import { buildInvitationMessage } from './src/halkhata/invitations/utils';
import { describe, expect, it } from 'vitest';

describe('buildInvitationMessage', () => {
  it('replaces customer name and halkhata date in Bangla template', () => {
    const message = buildInvitationMessage('রহিম', '2026-06-27');
    expect(message).toContain('প্রিয় রহিম');
    expect(message).toContain('রজ্জাক মেশিনারিজ');
    expect(message).toMatch(/জুন|June/);
  });
});
