import handler from './index.js';
export default function(req, res) { req.url = '/api/avatar'; return handler(req, res); }
