// Date utilities for handling serialization/deserialization
export const DateUtils = {
  /**
   * Safely format a date that might be a string or Date object
   */
  formatDate(date?: Date | string | null, options?: Intl.DateTimeFormatOptions): string {
    if (!date) return 'Never';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      if (!dateObj || isNaN(dateObj.getTime())) {
        return 'Invalid date';
      }
      
      return dateObj.toLocaleDateString(undefined, options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown';
    }
  },

  /**
   * Safely format a date and time
   */
  formatDateTime(date?: Date | string | null): string {
    if (!date) return 'Never';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      if (!dateObj || isNaN(dateObj.getTime())) {
        return 'Invalid date';
      }
      
      return dateObj.toLocaleString();
    } catch (error) {
      console.error('Error formatting datetime:', error);
      return 'Unknown';
    }
  },

  /**
   * Safely format time only
   */
  formatTime(date?: Date | string | null): string {
    if (!date) return 'Unknown';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      if (!dateObj || isNaN(dateObj.getTime())) {
        return 'Invalid time';
      }
      
      return dateObj.toLocaleTimeString();
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Unknown';
    }
  },

  /**
   * Convert a potentially string date back to a Date object
   */
  toDate(date?: Date | string | null): Date | undefined {
    if (!date) return undefined;
    
    try {
      if (date instanceof Date) return date;
      
      const dateObj = new Date(date);
      return isNaN(dateObj.getTime()) ? undefined : dateObj;
    } catch (error) {
      console.error('Error converting to date:', error);
      return undefined;
    }
  },

  /**
   * Check if a date is valid
   */
  isValidDate(date?: Date | string | null): boolean {
    if (!date) return false;
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj instanceof Date && !isNaN(dateObj.getTime());
    } catch {
      return false;
    }
  },

  /**
   * Get relative time string (e.g., "2 hours ago", "yesterday")
   */
  getRelativeTime(date?: Date | string | null): string {
    if (!date) return 'Never';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      if (!dateObj || isNaN(dateObj.getTime())) {
        return 'Invalid date';
      }
      
      const now = new Date();
      const diffMs = now.getTime() - dateObj.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return dateObj.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting relative time:', error);
      return 'Unknown';
    }
  }
};

export default DateUtils;
