import handler from './index.js';
export default function(req, res) { req.url = '/api/wallet'; return handler(req, res); }
