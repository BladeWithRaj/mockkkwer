import handler from './index.js';
export default function(req, res) { req.url = '/api/user-verify'; return handler(req, res); }
