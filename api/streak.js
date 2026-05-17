import handler from './index.js';
export default function(req, res) { req.url = '/api/streak'; return handler(req, res); }
