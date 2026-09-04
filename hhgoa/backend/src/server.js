// Local-dev only entry point. On Vercel, api/index.js exports the app
// directly instead — Vercel manages starting/stopping it and injects env
// vars itself, so nothing here runs in production.
require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`HH Goa backend running on http://localhost:${PORT}`);
});