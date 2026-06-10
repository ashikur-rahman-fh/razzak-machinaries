import { type AxiosError, isAxiosError } from 'axios';
import {
  getLocalizedErrorCodeMessage,
  getLocalizedUserMessage,
  USER_MESSAGES,
} from '../../i18n/error-messages';
import type { Language } from '../../i18n/types';
import { redactHeadersForDebug } from './logging';

export { USER_MESSAGES } from '../../i18n/error-messages';

export type ApiErrorBody = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

export type ApiErrorDebug = {
  url?: string;
  method?: string;
  headers?: Record<string, unknown>;
};

export class ApiError extends Error {
  readonly name = 'ApiError' as const;
  readonly status?: number;
  readonly code?: string;
  readonly details?: unknown;
  readonly requestId?: string;
  readonly serviceName?: string;
  readonly isNetworkError: boolean;
  readonly isTimeout: boolean;
  readonly isUnauthorized: boolean;
  readonly isForbidden: boolean;
  readonly isNotFound: boolean;
  readonly isValidationError: boolean;
  readonly isServerError: boolean;
  readonly isSessionExpired: boolean;
  readonly debug?: ApiErrorDebug;

  constructor(options: {
    message: string;
    status?: number;
    code?: string;
    details?: unknown;
    requestId?: string;
    serviceName?: string;
    isNetworkError?: boolean;
    isTimeout?: boolean;
    isUnauthorized?: boolean;
    isForbidden?: boolean;
    isNotFound?: boolean;
    isValidationError?: boolean;
    isServerError?: boolean;
    isSessionExpired?: boolean;
    debug?: ApiErrorDebug;
    cause?: unknown;
  }) {
    super(options.message);
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
    this.requestId = options.requestId;
    this.serviceName = options.serviceName;
    this.isNetworkError = options.isNetworkError ?? false;
    this.isTimeout = options.isTimeout ?? false;
    this.isUnauthorized = options.isUnauthorized ?? false;
    this.isForbidden = options.isForbidden ?? false;
    this.isNotFound = options.isNotFound ?? false;
    this.isValidationError = options.isValidationError ?? false;
    this.isServerError = options.isServerError ?? false;
    this.isSessionExpired = options.isSessionExpired ?? false;
    this.debug = options.debug;
    if (options.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isApiErrorBody(body: unknown): body is ApiErrorBody {
  if (typeof body !== 'object' || body === null) {
    return false;
  }
  const candidate = body as Record<string, unknown>;
  if (candidate.success !== false) {
    return false;
  }
  const error = candidate.error;
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const errorRecord = error as Record<string, unknown>;
  return typeof errorRecord.message === 'string' && typeof errorRecord.code === 'string';
}

export function mapHttpStatusToMessage(status: number): string {
  if (status === 400) {
    return USER_MESSAGES.badRequest;
  }
  if (status === 401) {
    return USER_MESSAGES.unauthorized;
  }
  if (status === 403) {
    return USER_MESSAGES.forbidden;
  }
  if (status === 404) {
    return USER_MESSAGES.notFound;
  }
  if (status === 405) {
    return USER_MESSAGES.methodNotAllowed;
  }
  if (status === 419 || status === 440) {
    return USER_MESSAGES.sessionExpired;
  }
  if (status === 422) {
    return USER_MESSAGES.validation;
  }
  if (status === 429) {
    return USER_MESSAGES.rateLimited;
  }
  if (status >= 500) {
    return USER_MESSAGES.serverError;
  }
  return USER_MESSAGES.unknown;
}

function extractRequestId(headers: Record<string, unknown> | undefined): string | undefined {
  if (!headers) {
    return undefined;
  }
  const candidates = ['x-request-id', 'x-correlation-id', 'request-id'];
  for (const key of candidates) {
    const value = headers[key] ?? headers[key.toLowerCase()];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }
  return undefined;
}

function parseErrorBody(data: unknown): { message: string; code?: string; details?: unknown } {
  if (isApiErrorBody(data)) {
    return {
      message: data.error.message,
      code: data.error.code,
      details: data.error.details,
    };
  }
  if (typeof data === 'object' && data !== null) {
    const record = data as Record<string, unknown>;
    if (typeof record.message === 'string') {
      return {
        message: record.message,
        code: typeof record.code === 'string' ? record.code : undefined,
        details: record.details,
      };
    }
    if (typeof record.detail === 'string') {
      return { message: record.detail };
    }
  }
  return { message: USER_MESSAGES.unknown };
}

function buildFlags(
  status: number | undefined,
  isNetwork: boolean,
  isTimeout: boolean,
  code?: string,
) {
  return {
    isNetworkError: isNetwork,
    isTimeout,
    isUnauthorized: status === 401,
    isForbidden: status === 403,
    isNotFound: status === 404,
    isValidationError: status === 422 || code === 'VALIDATION_ERROR',
    isServerError: status !== undefined && status >= 500,
    isSessionExpired: status === 419 || status === 440,
  };
}

export function normalizeAxiosError(error: unknown, serviceName: string): ApiError {
  if (isApiError(error)) {
    return error;
  }

  if (isAxiosError(error)) {
    const axiosError = error as AxiosError<unknown>;
    const status = axiosError.response?.status;
    const responseHeaders = axiosError.response?.headers as Record<string, unknown> | undefined;
    const requestId = extractRequestId(responseHeaders);
    const config = axiosError.config;

    const isTimeout =
      axiosError.code === 'ECONNABORTED' ||
      (typeof axiosError.message === 'string' &&
        axiosError.message.toLowerCase().includes('timeout'));
    const isNetwork = !axiosError.response && !isTimeout;

    if (isNetwork) {
      return new ApiError({
        message: USER_MESSAGES.network,
        serviceName,
        requestId,
        ...buildFlags(undefined, true, false),
        debug: buildDebug(config, responseHeaders),
        cause: error,
      });
    }

    if (isTimeout) {
      return new ApiError({
        message: USER_MESSAGES.timeout,
        serviceName,
        requestId,
        ...buildFlags(undefined, false, true),
        debug: buildDebug(config, responseHeaders),
        cause: error,
      });
    }

    const parsed = parseErrorBody(axiosError.response?.data);
    const message =
      status !== undefined && !isApiErrorBody(axiosError.response?.data)
        ? mapHttpStatusToMessage(status)
        : parsed.message;

    return new ApiError({
      message,
      status,
      code: parsed.code,
      details: parsed.details,
      requestId,
      serviceName,
      ...buildFlags(status, false, false, parsed.code),
      debug: buildDebug(config, responseHeaders),
      cause: error,
    });
  }

  return new ApiError({
    message: USER_MESSAGES.unknown,
    serviceName,
    cause: error,
  });
}

function buildDebug(
  config: { url?: string; method?: string; headers?: unknown } | undefined,
  responseHeaders: Record<string, unknown> | undefined,
): ApiErrorDebug | undefined {
  if (process.env.NODE_ENV === 'production') {
    return undefined;
  }
  const headers =
    config?.headers && typeof config.headers === 'object'
      ? redactHeadersForDebug(config.headers as Record<string, unknown>)
      : undefined;
  return {
    url: config?.url,
    method: config?.method?.toUpperCase(),
    headers: headers ?? redactHeadersForDebug(responseHeaders),
  };
}

export function getUserFacingMessage(error: unknown, language: Language = 'en'): string {
  if (isApiError(error)) {
    const codeMessage = getLocalizedErrorCodeMessage(error.code, language);
    if (codeMessage) {
      return codeMessage;
    }

    if (error.isNetworkError) {
      return getLocalizedUserMessage('network', language);
    }
    if (error.isTimeout) {
      return getLocalizedUserMessage('timeout', language);
    }
    if (error.isUnauthorized) {
      return getLocalizedUserMessage('unauthorized', language);
    }
    if (error.isForbidden) {
      return getLocalizedUserMessage('forbidden', language);
    }
    if (error.isNotFound) {
      return getLocalizedUserMessage('notFound', language);
    }
    if (error.isValidationError) {
      return getLocalizedUserMessage('validation', language);
    }
    if (error.isSessionExpired) {
      return getLocalizedUserMessage('sessionExpired', language);
    }
    if (error.isServerError) {
      return getLocalizedUserMessage('serverError', language);
    }

    return getLocalizedUserMessage('unknown', language);
  }
  return getLocalizedUserMessage('unknown', language);
}
