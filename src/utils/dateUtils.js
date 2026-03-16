// src/utils/dateUtils.js
export function timeAgo(dateInput) {
  const diff = Date.now() - new Date(dateInput).getTime();
  const s = Math.floor(diff / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (s < 60)  return 'just now';
  if (m < 60)  return `${m}m ago`;
  if (h < 24)  return `${h}h ago`;
  if (d < 7)   return `${d}d ago`;
  return new Date(dateInput).toLocaleDateString();
}

export function timeLeft(dateInput) {
  if (!dateInput) return null;
  const diff = new Date(dateInput).getTime() - Date.now();
  if (diff <= 0) return 'Ended';
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (d >= 1) return `${d} day${d !== 1 ? 's' : ''} left`;
  if (h >= 1) return `${h}h left`;
  return 'Ending soon';
}

export function formatDate(dateInput) {
  return new Date(dateInput).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}
