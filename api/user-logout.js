import handler from './index.js';
export default function(req, res) { req.url = '/api/user-logout'; return handler(req, res); }
