import handler from './index.js';
export default function(req, res) { req.url = '/api/profile'; return handler(req, res); }
