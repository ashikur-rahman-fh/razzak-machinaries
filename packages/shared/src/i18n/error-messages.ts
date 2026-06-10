import type { Language } from './types';

export const USER_MESSAGES = {
  network: 'We could not connect to the server. Please check your connection and try again.',
  timeout: 'The request took too long. Please try again.',
  badRequest: 'The request could not be processed. Please check your input and try again.',
  unauthorized: 'You need to sign in to continue.',
  forbidden: 'You do not have permission to perform this action.',
  notFound: 'We could not find the requested resource.',
  validation: 'Please check your input and try again.',
  rateLimited: 'Too many requests. Please wait a moment and try again.',
  methodNotAllowed: 'This action is not supported.',
  sessionExpired: 'Your session has expired. Please sign in again.',
  serverError: 'The server had a problem. Please try again later.',
  unknown: 'Something went wrong. Please try again.',
} as const;

export const USER_MESSAGES_BN = {
  network: 'সার্ভারের সাথে সংযোগ করা যায়নি। আপনার ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।',
  timeout: 'অনুরোধটি সময়সীমা অতিক্রম করেছে। আবার চেষ্টা করুন।',
  badRequest: 'অনুরোধটি প্রক্রিয়া করা যায়নি। আপনার তথ্য পরীক্ষা করে আবার চেষ্টা করুন।',
  unauthorized: 'চালিয়ে যেতে সাইন ইন করুন।',
  forbidden: 'এই কাজটি করার অনুমতি আপনার নেই।',
  notFound: 'অনুরোধ করা তথ্য খুঁজে পাওয়া যায়নি।',
  validation: 'আপনার তথ্য পরীক্ষা করে আবার চেষ্টা করুন।',
  rateLimited: 'অতিরিক্ত অনুরোধ পাঠানো হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।',
  methodNotAllowed: 'এই কাজটি সমর্থিত নয়।',
  sessionExpired: 'আপনার সেশনের মেয়াদ শেষ হয়েছে। আবার সাইন ইন করুন।',
  serverError: 'সার্ভারে সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।',
  unknown: 'কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।',
} as const;

type UserMessageKey = keyof typeof USER_MESSAGES;

const USER_MESSAGE_KEYS: Record<UserMessageKey, Record<Language, string>> = {
  network: { en: USER_MESSAGES.network, bn: USER_MESSAGES_BN.network },
  timeout: { en: USER_MESSAGES.timeout, bn: USER_MESSAGES_BN.timeout },
  badRequest: { en: USER_MESSAGES.badRequest, bn: USER_MESSAGES_BN.badRequest },
  unauthorized: { en: USER_MESSAGES.unauthorized, bn: USER_MESSAGES_BN.unauthorized },
  forbidden: { en: USER_MESSAGES.forbidden, bn: USER_MESSAGES_BN.forbidden },
  notFound: { en: USER_MESSAGES.notFound, bn: USER_MESSAGES_BN.notFound },
  validation: { en: USER_MESSAGES.validation, bn: USER_MESSAGES_BN.validation },
  rateLimited: { en: USER_MESSAGES.rateLimited, bn: USER_MESSAGES_BN.rateLimited },
  methodNotAllowed: { en: USER_MESSAGES.methodNotAllowed, bn: USER_MESSAGES_BN.methodNotAllowed },
  sessionExpired: { en: USER_MESSAGES.sessionExpired, bn: USER_MESSAGES_BN.sessionExpired },
  serverError: { en: USER_MESSAGES.serverError, bn: USER_MESSAGES_BN.serverError },
  unknown: { en: USER_MESSAGES.unknown, bn: USER_MESSAGES_BN.unknown },
};

export const ERROR_CODE_MESSAGES: Record<string, Record<Language, string>> = {
  NOT_FOUND: USER_MESSAGE_KEYS.notFound,
  METHOD_NOT_ALLOWED: USER_MESSAGE_KEYS.methodNotAllowed,
  VALIDATION_ERROR: USER_MESSAGE_KEYS.validation,
  INTERNAL_SERVER_ERROR: USER_MESSAGE_KEYS.serverError,
  API_ERROR: USER_MESSAGE_KEYS.unknown,
  UNAUTHORIZED: USER_MESSAGE_KEYS.unauthorized,
  INVALID_CREDENTIALS: {
    en: 'Invalid login details. Please check your credentials and try again.',
    bn: 'ভুল লগইন তথ্য। আপনার তথ্য পরীক্ষা করে আবার চেষ্টা করুন।',
  },
  ADMIN_FORBIDDEN: USER_MESSAGE_KEYS.forbidden,
  INVALID_CURRENT_PASSWORD: {
    en: 'The current password is incorrect.',
    bn: 'বর্তমান পাসওয়ার্ড সঠিক নয়।',
  },
  WEAK_PASSWORD: {
    en: 'Please choose a stronger password.',
    bn: 'অনুগ্রহ করে আরও শক্তিশালী পাসওয়ার্ড বেছে নিন।',
  },
};

export function getLocalizedUserMessage(key: UserMessageKey, language: Language): string {
  return USER_MESSAGE_KEYS[key][language] ?? USER_MESSAGE_KEYS[key].en;
}

export function getLocalizedErrorCodeMessage(
  code: string | undefined,
  language: Language,
): string | undefined {
  if (!code) {
    return undefined;
  }
  return ERROR_CODE_MESSAGES[code]?.[language] ?? ERROR_CODE_MESSAGES[code]?.en;
}
