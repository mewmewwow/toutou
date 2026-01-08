/**
 * FSRS utility functions for retrievability calculation and urgency levels
 */

export type UrgencyLevel = 'overdue' | 'due_today' | 'due_soon' | 'stable';

/**
 * Calculate retrievability (probability of recall) for a card
 * Using FSRS formula: R = (1 + factor * t/S)^decay
 *
 * @param stability - Card stability in days
 * @param daysSinceReview - Days since last review
 * @returns Retrievability as a decimal (0-1)
 */
export function calculateRetrievability(stability: number, daysSinceReview: number): number {
  if (stability <= 0 || daysSinceReview < 0) return 0;

  const decay = -0.5;
  const factor = 19 / 81; // FSRS-4.5 factor

  const retrievability = Math.pow(1 + (factor * daysSinceReview) / stability, decay);
  return Math.max(0, Math.min(1, retrievability));
}

/**
 * Convert retrievability to percentage for display
 *
 * @param stability - Card stability in days
 * @param daysSinceReview - Days since last review
 * @returns Retrievability as percentage (0-100)
 */
export function calculateRetrievabilityPercent(stability: number, daysSinceReview: number): number {
  return Math.round(calculateRetrievability(stability, daysSinceReview) * 100);
}

/**
 * Determine urgency level based on due date
 *
 * @param dueAt - Due date for the card
 * @returns Urgency level for display/sorting
 */
export function getUrgencyLevel(dueAt: Date): UrgencyLevel {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(dueAt.getFullYear(), dueAt.getMonth(), dueAt.getDate());

  const diffMs = dueDay.getTime() - today.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0) {
    return 'overdue';
  } else if (diffDays === 0) {
    return 'due_today';
  } else if (diffDays <= 3) {
    return 'due_soon';
  } else {
    return 'stable';
  }
}

/**
 * Calculate days since a given date
 *
 * @param date - The reference date
 * @returns Number of days since the date
 */
export function daysSince(date: Date): number {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.max(0, diff / (1000 * 60 * 60 * 24));
}

/**
 * Calculate days until a given date
 *
 * @param date - The target date
 * @returns Number of days until the date (negative if past)
 */
export function daysUntil(date: Date): number {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return diff / (1000 * 60 * 60 * 24);
}

/**
 * Format interval for display
 *
 * @param days - Interval in days
 * @returns Human-readable interval string in Chinese
 */
export function formatInterval(days: number): string {
  if (days < 1) {
    const hours = Math.round(days * 24);
    if (hours < 1) {
      const minutes = Math.round(days * 24 * 60);
      return `${minutes}分钟`;
    }
    return `${hours}小时`;
  } else if (days < 30) {
    return `${Math.round(days)}天`;
  } else if (days < 365) {
    const months = Math.round(days / 30);
    return `${months}个月`;
  } else {
    const years = Math.round(days / 365);
    return `${years}年`;
  }
}

/**
 * Get color class for retrievability display
 *
 * @param retrievability - Retrievability as decimal (0-1)
 * @returns CSS color class
 */
export function getRetrievabilityColor(retrievability: number): string {
  if (retrievability >= 0.9) {
    return 'text-green-600'; // Strong memory
  } else if (retrievability >= 0.7) {
    return 'text-yellow-600'; // Good memory
  } else if (retrievability >= 0.5) {
    return 'text-orange-600'; // Fading memory
  } else {
    return 'text-red-600'; // Weak memory
  }
}

/**
 * Get urgency color for display
 *
 * @param urgency - Urgency level
 * @returns CSS color class
 */
export function getUrgencyColor(urgency: UrgencyLevel): string {
  switch (urgency) {
    case 'overdue':
      return 'text-red-600 bg-red-50';
    case 'due_today':
      return 'text-orange-600 bg-orange-50';
    case 'due_soon':
      return 'text-yellow-600 bg-yellow-50';
    case 'stable':
      return 'text-green-600 bg-green-50';
  }
}
