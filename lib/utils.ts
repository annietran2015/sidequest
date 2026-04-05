import type { QuestCadence, VibeTag } from '@/types';
import { VIBE_TAGS, CADENCES } from '@/constants';

/**
 * Format remaining time until expiry as a human-readable string.
 */
export function formatTimeRemaining(expiresAt: string): string {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();

  if (diffMs <= 0) return 'Expired';

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Format a date as a relative string like "2 hours ago", "yesterday", "3 days ago".
 */
export function formatRelativeDate(date: string | Date): string {
  const now = new Date();
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffWeeks === 1) return '1 week ago';
  if (diffWeeks < 5) return `${diffWeeks} weeks ago`;
  if (diffMonths === 1) return '1 month ago';
  return `${diffMonths} months ago`;
}

/**
 * Format a date as a readable month + year string for grouping in lists.
 */
export function formatMonthYear(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Format a date as a short readable string.
 */
export function formatShortDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Compute an expires_at ISO timestamp based on cadence from now.
 */
export function computeExpiresAt(cadence: QuestCadence): string {
  const now = new Date();
  const meta = CADENCES.find((c) => c.id === cadence);
  const hours = meta?.durationHours ?? 24;
  const expires = new Date(now.getTime() + hours * 60 * 60 * 1000);
  return expires.toISOString();
}

/**
 * Get the emoji for a vibe tag.
 */
export function getVibeEmoji(vibeTag: VibeTag): string {
  const meta = VIBE_TAGS.find((v) => v.id === vibeTag);
  return meta?.emoji ?? '✨';
}

/**
 * Get the color for a vibe tag.
 */
export function getVibeColor(vibeTag: VibeTag): string {
  const meta = VIBE_TAGS.find((v) => v.id === vibeTag);
  return meta?.color ?? '#C4603A';
}

/**
 * Get the label for a vibe tag.
 */
export function getVibeLabel(vibeTag: VibeTag): string {
  const meta = VIBE_TAGS.find((v) => v.id === vibeTag);
  return meta?.label ?? vibeTag;
}

/**
 * Get initials from a display name (up to 2 chars).
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Validate a username: 3-20 chars, only letters, numbers, underscores.
 */
export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
