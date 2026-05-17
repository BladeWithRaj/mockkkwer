// Vercel endpoint proxy → unified handler (preserves query string)
import handler from './index.js';
export default function(req, res) {
  // Keep original URL to preserve ?action=xxx&page=xxx query params
  if (!req.url.includes('/admin-data')) req.url = '/api/admin-data';
  return handler(req, res);
}
