export const DEFAULT_NEWS_IMAGE = `${process.env.PUBLIC_URL || ''}/news.png`;

export function resolveMediaUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const path = url.startsWith('/') ? url : `/${url}`;
  return `http://127.0.0.1:8000${path}`;
}

export function formatNewsDate(iso, { withTime = false } = {}) {
  if (!iso) return '';
  try {
    const options = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    if (withTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return new Date(iso).toLocaleString('ru-RU', options);
  } catch {
    return iso;
  }
}

export function getNewsImageSrc(photo) {
  const media = resolveMediaUrl(photo);
  return media || DEFAULT_NEWS_IMAGE;
}

export function handleNewsImageError(event) {
  const img = event.currentTarget;
  if (img.dataset.fallbackApplied === '1') return;
  img.dataset.fallbackApplied = '1';
  img.src = DEFAULT_NEWS_IMAGE;
}

export function excerptNewsText(text, maxLength = 220) {
  if (!text) return '';
  const normalized = text.trim().replace(/\s+/g, ' ');
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trim()}…`;
}
