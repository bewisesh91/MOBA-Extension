// tiny wrapper with default env vars
// extension port 2000으로 변경
module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 2000,
};
