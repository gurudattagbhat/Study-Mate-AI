const app = require('../server');
const { connectDB } = require('../config/db');

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n==================================================`);
      console.log(`🚀 Study Mate AI Server running on http://0.0.0.0:${PORT}`);
      console.log(`==================================================\n`);
    });
  });
}

module.exports = app;
module.exports.default = app;
