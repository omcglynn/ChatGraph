/**
 * Formats a date string to a clean, human-readable format
 * @param {string} dateString - ISO date string or date string
 * @returns {string} Formatted date string
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    // Less than a minute ago
    if (diffSecs < 60) {
      return 'Just now';
    }
    
    // Less than an hour ago
    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'min' : 'mins'} ago`;
    }
    
    // Less than 24 hours ago
    if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    // Less than 7 days ago
    if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    }
    
    // Less than 30 days ago
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }
    
    // Less than a year ago - show month and day
    if (diffDays < 365) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    // More than a year ago - show full date
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

