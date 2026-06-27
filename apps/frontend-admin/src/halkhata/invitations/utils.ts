import type { HalkhataInvitationPageContext } from '@razzak-machinaries/shared/api';

export type InvitationSelectionState =
  | { mode: 'manual'; ids: Set<number> }
  | { mode: 'all_active' }
  | { mode: 'due_only' };

export const INVITATION_LARGE_BATCH_THRESHOLD = 50;
export const INVITATION_CUSTOMER_PAGE_SIZE = 50;

export function createManualSelectionState(): InvitationSelectionState {
  return { mode: 'manual', ids: new Set() };
}

export function getSelectedCustomerCount(
  selection: InvitationSelectionState,
  context: HalkhataInvitationPageContext,
): number {
  if (selection.mode === 'all_active') {
    return context.totalActiveCustomers;
  }
  if (selection.mode === 'due_only') {
    return context.totalDueCustomers;
  }
  return selection.ids.size;
}

export function canGenerateInvitations(
  selection: InvitationSelectionState,
  context: HalkhataInvitationPageContext,
): boolean {
  return getSelectedCustomerCount(selection, context) > 0;
}

export function formatInvitationDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return date.toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function buildInvitationMessage(customerName: string, halkhataDate: string): string {
  const formattedDate = formatInvitationDate(halkhataDate);
  return `প্রিয় ${customerName},

আসসালামু আলাইকুম।

আপনাকে জানানো যাচ্ছে যে, ${formattedDate} তারিখে আমাদের প্রতিষ্ঠান রজ্জাক মেশিনারিজ-এর হালখাতা অনুষ্ঠিত হবে। উক্ত দিনে আপনাকে আমাদের দোকানে উপস্থিত থাকার জন্য আন্তরিকভাবে আমন্ত্রণ জানানো হলো।

আপনার উপস্থিতি আমাদের জন্য অত্যন্ত আনন্দের হবে। আপনার বকেয়া হিসাব থাকলে অনুগ্রহ করে হালখাতার দিনে পরিশোধ করার জন্য অনুরোধ করা হচ্ছে।

ধন্যবাদান্তে,
রজ্জাক মেশিনারিজ`;
}
