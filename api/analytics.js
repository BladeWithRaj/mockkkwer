import handler from './index.js';
export default function(req, res) { req.url = '/api/analytics'; return handler(req, res); }
