/**
 * Validation utilities for incoming socket and HTTP payloads.
 * Protects server integrity against invalid types, malicious inputs, and edge cases.
 */

export interface ValidationResult<T> {
  isValid: boolean;
  value?: T;
  error?: string;
}

/**
 * Validates and sanitizes a display username.
 * Constraints: string, trimmed length 1-30 characters, no dangerous control characters.
 */
export function validateUsername(input: unknown): ValidationResult<string> {
  if (typeof input !== 'string') {
    return { isValid: false, error: 'Username must be a text string.' };
  }

  const trimmed = input.trim();

  if (trimmed.length < 1) {
    return { isValid: false, error: 'Username cannot be empty.' };
  }

  if (trimmed.length > 30) {
    return { isValid: false, error: 'Username must be 30 characters or fewer.' };
  }

  // Strip null bytes and non-printable control characters
  const sanitized = trimmed.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

  if (sanitized.length < 1) {
    return { isValid: false, error: 'Username contains invalid characters.' };
  }

  return { isValid: true, value: sanitized };
}

/**
 * Validates and normalizes a room code.
 * Constraints: alphanumeric string, 4-12 characters, uppercase.
 */
export function validateRoomCode(input: unknown): ValidationResult<string> {
  if (typeof input !== 'string') {
    return { isValid: false, error: 'Room code must be a text string.' };
  }

  const clean = input.trim().toUpperCase();

  if (!/^[A-Z0-9_-]{4,12}$/.test(clean)) {
    return {
      isValid: false,
      error: 'Room code must be 4 to 12 alphanumeric characters (e.g. SYNC-4A9B or ABC123).',
    };
  }

  return { isValid: true, value: clean };
}

/**
 * Validates YouTube video ID format.
 * Can be an 11-character alphanumeric string or null.
 */
export function validateVideoId(input: unknown): ValidationResult<string | null> {
  if (input === null || input === undefined || input === '') {
    return { isValid: true, value: null };
  }

  if (typeof input !== 'string') {
    return { isValid: false, error: 'Video ID must be a string or null.' };
  }

  const trimmed = input.trim();

  // Standard YouTube video ID is 11 alphanumeric characters (plus - and _)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return { isValid: true, value: trimmed };
  }

  return { isValid: false, error: 'Invalid YouTube video ID format.' };
}

/**
 * Validates playback timestamp position.
 */
export function validatePlaybackTime(input: unknown): ValidationResult<number> {
  if (typeof input !== 'number' || isNaN(input) || !isFinite(input)) {
    return { isValid: false, error: 'Playback time must be a valid finite number.' };
  }

  if (input < 0) {
    return { isValid: true, value: 0 };
  }

  return { isValid: true, value: input };
}

/**
 * Validates a chat message text payload.
 * Constraints: string, non-empty after trimming, maximum 500 characters.
 */
export function validateChatMessage(input: unknown): ValidationResult<string> {
  let rawText = '';

  if (typeof input === 'string') {
    rawText = input;
  } else if (input && typeof input === 'object') {
    const obj = input as Record<string, unknown>;
    if (typeof obj.text === 'string') {
      rawText = obj.text;
    } else if (typeof obj.message === 'string') {
      rawText = obj.message;
    } else if (typeof obj.content === 'string') {
      rawText = obj.content;
    } else {
      return { isValid: false, error: 'Chat message must contain text or message field.' };
    }
  } else {
    return { isValid: false, error: 'Chat message payload must be a string or object.' };
  }

  const trimmed = rawText.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'Chat message cannot be empty.' };
  }

  if (trimmed.length > 500) {
    return {
      isValid: false,
      error: `Chat message exceeds maximum allowed length of 500 characters (length: ${trimmed.length}).`,
    };
  }

  // Strip non-printable ASCII control characters (preserving newlines and emojis)
  const sanitized = trimmed.replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g, '');

  if (sanitized.length === 0) {
    return { isValid: false, error: 'Chat message contains invalid control characters.' };
  }

  return { isValid: true, value: sanitized };
}

