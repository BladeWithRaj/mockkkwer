import handler from './index.js';
export default function(req, res) { req.url = '/api/exams'; return handler(req, res); }
