import handler from './index.js';
export default function(req, res) {
  // Preserve query string for profile-summary
  if (!req.url.includes('/profile-summary')) req.url = '/api/profile-summary';
  return handler(req, res);
}
