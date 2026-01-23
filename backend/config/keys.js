// Detect environment and load appropriate config
// Vercel sets NODE_ENV to production automatically
if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
  module.exports = require('./prod');
} else {
  module.exports = require('./dev');
}
