// Vercel's Node.js runtime treats a default-exported Express app as a
// request handler automatically — so we just hand it the app we built,
// with no app.listen() call (Vercel manages that part itself).
const app = require('../src/app');
module.exports = app;