/**
 * Date and time formatting utilities for session display
 */

export interface DateTimeFormatOptions {
  includeTime?: boolean;
  includeSeconds?: boolean;
  use12Hour?: boolean;
  timezone?: string;
  locale?: string;
}

export interface RelativeTimeOptions {
  includeAgo?: boolean;
  maxDays?: number;
  fallbackToAbsolute?: boolean;
}

/**
 * Format date for display with various options
 */
export function formatDateTime(
  date: Date | string,
  options: DateTimeFormatOptions = {}
): string {
  const {
    includeTime = true,
    includeSeconds = false,
    use12Hour = true,
    timezone = "UTC",
    locale = "en-US",
  } = options;

  const dateObj = typeof date === "string" ? new Date(date) : date;

  const formatOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: timezone,
  };

  if (includeTime) {
    formatOptions.hour = "2-digit";
    formatOptions.minute = "2-digit";

    if (includeSeconds) {
      formatOptions.second = "2-digit";
    }

    if (use12Hour) {
      formatOptions.hour12 = true;
    } else {
      formatOptions.hour12 = false;
    }
  }

  return dateObj.toLocaleString(locale, formatOptions);
}

/**
 * Format date only (no time)
 */
export function formatDateOnly(
  date: Date | string,
  options: { locale?: string; timezone?: string } = {}
): string {
  const { locale = "en-US", timezone = "UTC" } = options;
  const dateObj = typeof date === "string" ? new Date(date) : date;

  return dateObj.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: timezone,
  });
}

/**
 * Format time only (no date)
 */
export function formatTimeOnly(
  date: Date | string,
  options: {
    includeSeconds?: boolean;
    use12Hour?: boolean;
    locale?: string;
    timezone?: string;
  } = {}
): string {
  const {
    includeSeconds = false,
    use12Hour = true,
    locale = "en-US",
    timezone = "UTC",
  } = options;

  const dateObj = typeof date === "string" ? new Date(date) : date;

  return dateObj.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: includeSeconds ? "2-digit" : undefined,
    hour12: use12Hour,
    timeZone: timezone,
  });
}

/**
 * Format relative time (e.g., "2 hours ago", "in 30 minutes")
 */
export function formatRelativeTime(
  date: Date | string,
  options: RelativeTimeOptions = {}
): string {
  const { includeAgo = true, maxDays = 7, fallbackToAbsolute = true } = options;

  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInMs = dateObj.getTime() - now.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  // If more than maxDays, fall back to absolute format
  if (Math.abs(diffInDays) > maxDays) {
    return fallbackToAbsolute ? formatDateTime(dateObj) : "Long ago";
  }

  const isPast = diffInMs < 0;
  const absDiffInSeconds = Math.abs(diffInSeconds);
  const absDiffInMinutes = Math.abs(diffInMinutes);
  const absDiffInHours = Math.abs(diffInHours);
  const absDiffInDays = Math.abs(diffInDays);

  let timeString = "";

  if (absDiffInDays > 0) {
    timeString = `${absDiffInDays} day${absDiffInDays === 1 ? "" : "s"}`;
  } else if (absDiffInHours > 0) {
    timeString = `${absDiffInHours} hour${absDiffInHours === 1 ? "" : "s"}`;
  } else if (absDiffInMinutes > 0) {
    timeString = `${absDiffInMinutes} minute${absDiffInMinutes === 1 ? "" : "s"}`;
  } else {
    timeString = `${absDiffInSeconds} second${absDiffInSeconds === 1 ? "" : "s"}`;
  }

  if (includeAgo) {
    return isPast ? `${timeString} ago` : `in ${timeString}`;
  }

  return timeString;
}

/**
 * Format duration between two dates
 */
export function formatDuration(
  startDate: Date | string,
  endDate: Date | string
): string {
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;

  const diffInMs = end.getTime() - start.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays > 0) {
    return `${diffInDays}d ${diffInHours % 24}h ${diffInMinutes % 60}m`;
  } else if (diffInHours > 0) {
    return `${diffInHours}h ${diffInMinutes % 60}m`;
  } else if (diffInMinutes > 0) {
    return `${diffInMinutes}m ${diffInSeconds % 60}s`;
  } else {
    return `${diffInSeconds}s`;
  }
}

/**
 * Format time remaining until a future date
 */
export function formatTimeRemaining(
  targetDate: Date | string,
  options: {
    showSeconds?: boolean;
    compact?: boolean;
  } = {}
): string {
  const { showSeconds = false, compact = false } = options;

  const target =
    typeof targetDate === "string" ? new Date(targetDate) : targetDate;
  const now = new Date();
  const diffInMs = target.getTime() - now.getTime();

  if (diffInMs <= 0) {
    return "Expired";
  }

  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (compact) {
    if (diffInDays > 0) {
      return `${diffInDays}d ${diffInHours % 24}h`;
    } else if (diffInHours > 0) {
      return `${diffInHours}h ${diffInMinutes % 60}m`;
    } else if (diffInMinutes > 0) {
      return showSeconds
        ? `${diffInMinutes}m ${diffInSeconds % 60}s`
        : `${diffInMinutes}m`;
    } else {
      return `${diffInSeconds}s`;
    }
  } else {
    const parts: string[] = [];

    if (diffInDays > 0) {
      parts.push(`${diffInDays} day${diffInDays === 1 ? "" : "s"}`);
    }
    if (diffInHours % 24 > 0) {
      parts.push(
        `${diffInHours % 24} hour${diffInHours % 24 === 1 ? "" : "s"}`
      );
    }
    if (diffInMinutes % 60 > 0) {
      parts.push(
        `${diffInMinutes % 60} minute${diffInMinutes % 60 === 1 ? "" : "s"}`
      );
    }
    if (showSeconds && diffInSeconds % 60 > 0) {
      parts.push(
        `${diffInSeconds % 60} second${diffInSeconds % 60 === 1 ? "" : "s"}`
      );
    }

    return parts.join(", ");
  }
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const today = new Date();

  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is yesterday
 */
export function isYesterday(date: Date | string): boolean {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return (
    dateObj.getDate() === yesterday.getDate() &&
    dateObj.getMonth() === yesterday.getMonth() &&
    dateObj.getFullYear() === yesterday.getFullYear()
  );
}

/**
 * Check if a date is within the last N days
 */
export function isWithinLastDays(date: Date | string, days: number): boolean {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return dateObj >= cutoff;
}

/**
 * Format date with smart relative/absolute display
 */
export function formatSmartDateTime(
  date: Date | string,
  options: {
    maxRelativeDays?: number;
    includeTime?: boolean;
    locale?: string;
  } = {}
): string {
  const { maxRelativeDays = 7, includeTime = true, locale = "en-US" } = options;
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isToday(dateObj)) {
    return includeTime ? `Today at ${formatTimeOnly(dateObj)}` : "Today";
  }

  if (isYesterday(dateObj)) {
    return includeTime
      ? `Yesterday at ${formatTimeOnly(dateObj)}`
      : "Yesterday";
  }

  if (isWithinLastDays(dateObj, maxRelativeDays)) {
    return formatRelativeTime(dateObj, { includeAgo: true });
  }

  return formatDateTime(dateObj, { includeTime, locale });
}

/**
 * Get timezone offset string
 */
export function getTimezoneOffset(): string {
  const offset = new Date().getTimezoneOffset();
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  const sign = offset <= 0 ? "+" : "-";

  return `UTC${sign}${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

/**
 * Convert date to ISO string with timezone
 */
export function toISOStringWithTimezone(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const timezoneOffset = getTimezoneOffset();

  return `${dateObj.toISOString().slice(0, -1)}${timezoneOffset}`;
}

/**
 * Parse date string with timezone support
 */
export function parseDateWithTimezone(dateString: string): Date {
  // Handle ISO strings with timezone
  if (
    dateString.includes("T") &&
    (dateString.includes("+") || dateString.includes("Z"))
  ) {
    return new Date(dateString);
  }

  // Handle other formats
  return new Date(dateString);
}

/**
 * Format date for API requests (ISO format)
 */
export function formatDateForAPI(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toISOString();
}

/**
 * Format date for display in tables (compact format)
 */
export function formatDateForTable(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isToday(dateObj)) {
    return `Today ${formatTimeOnly(dateObj, { use12Hour: false })}`;
  }

  if (isYesterday(dateObj)) {
    return `Yesterday ${formatTimeOnly(dateObj, { use12Hour: false })}`;
  }

  return formatDateTime(dateObj, {
    includeTime: true,
    use12Hour: false,
    includeSeconds: false,
  });
}
