import handler from './index.js';
export default function(req, res) { req.url = '/api/track'; return handler(req, res); }
