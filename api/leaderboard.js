import handler from './index.js';
export default function(req, res) { req.url = '/api/leaderboard'; return handler(req, res); }
