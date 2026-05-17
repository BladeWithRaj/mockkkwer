import handler from './index.js';
export default function(req, res) { req.url = '/api/rewards'; return handler(req, res); }
