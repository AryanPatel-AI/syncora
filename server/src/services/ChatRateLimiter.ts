/**
 * In-memory sliding-window rate limiter for real-time room chat.
 * Prevents message spamming and flooding while allowing natural conversation.
 */
export class ChatRateLimiter {
  private static instance: ChatRateLimiter;

  // Map of userId -> array of message timestamps in ms
  private userMessageHistory = new Map<string, number[]>();

  // Configuration
  private readonly windowMs: number;
  private readonly maxMessages: number;
  private readonly minIntervalMs: number;

  constructor(windowMs = 3000, maxMessages = 5, minIntervalMs = 100) {
    this.windowMs = windowMs;
    this.maxMessages = maxMessages;
    this.minIntervalMs = minIntervalMs;
  }

  public static getInstance(): ChatRateLimiter {
    if (!ChatRateLimiter.instance) {
      ChatRateLimiter.instance = new ChatRateLimiter();
    }
    return ChatRateLimiter.instance;
  }

  /**
   * Checks whether the user is rate-limited.
   * If allowed, records the message timestamp.
   */
  public checkLimit(userId: string): { allowed: boolean; error?: string; retryAfterMs?: number } {
    const now = Date.now();
    const history = this.userMessageHistory.get(userId) || [];

    // Filter out timestamps outside the rolling window
    const recent = history.filter((ts) => now - ts < this.windowMs);

    // Check minimum interval between messages
    if (recent.length > 0) {
      const lastTs = recent[recent.length - 1];
      const timeSinceLast = now - lastTs;
      if (timeSinceLast < this.minIntervalMs) {
        const retryAfter = this.minIntervalMs - timeSinceLast;
        return {
          allowed: false,
          error: 'You are typing too fast. Please slow down.',
          retryAfterMs: retryAfter,
        };
      }
    }

    // Check sliding window message count limit
    if (recent.length >= this.maxMessages) {
      const oldestInWindow = recent[0];
      const retryAfter = Math.max(100, this.windowMs - (now - oldestInWindow));
      return {
        allowed: false,
        error: `Message rate limit reached (max ${this.maxMessages} messages per 3s). Please wait a moment.`,
        retryAfterMs: retryAfter,
      };
    }

    // Allowed: record timestamp
    recent.push(now);
    this.userMessageHistory.set(userId, recent);

    return { allowed: true };
  }

  /**
   * Resets limit for a specific user or clears all records.
   */
  public reset(userId?: string): void {
    if (userId) {
      this.userMessageHistory.delete(userId);
    } else {
      this.userMessageHistory.clear();
    }
  }
}
