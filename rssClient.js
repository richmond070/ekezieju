// ===================================
// REUSABLE RSS CLIENT (RSS2JSON)
// ===================================

const RSS_CACHE_PREFIX = 'rss_cache_';
const CACHE_TTL = 1000 * 60 * 60 * 6; // 6 hours

/**
 * Simple HTML sanitizer
 * Removes scripts, iframes, and inline event handlers
 */
export function sanitizeHTML(html) {
    const div = document.createElement('div');
    div.innerHTML = html;

    div.querySelectorAll('script, iframe').forEach(el => el.remove());

    [...div.querySelectorAll('*')].forEach(el => {
        [...el.attributes].forEach(attr => {
            if (attr.name.startsWith('on')) {
                el.removeAttribute(attr.name);
            }
        });
    });

    return div;
}


/**
 * Fetch RSS feed via RSS2JSON with caching
 */
export async function fetchRSS({
    rssUrl,
    limit = 3,
    cacheKey = rssUrl
}) {
    const storageKey = RSS_CACHE_PREFIX + cacheKey;
    const cached = localStorage.getItem(storageKey);

    if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
            return data.slice(0, limit);
        }
    }

    const endpoint =
        `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

    const response = await fetch(endpoint);
    if (!response.ok) throw new Error('RSS fetch failed');

    const json = await response.json();
    if (!json.items) throw new Error('Invalid RSS response');

    const posts = json.items.slice(0, limit);

    localStorage.setItem(
        storageKey,
        JSON.stringify({ timestamp: Date.now(), data: posts })
    );

    return posts;
}
