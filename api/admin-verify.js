// Vercel endpoint proxy → unified handler
import handler from './index.js';
export default function(req, res) { req.url = '/api/admin-verify'; return handler(req, res); }
