import handler from './index.js';
export default function(req, res) { req.url = '/api/submit'; return handler(req, res); }
