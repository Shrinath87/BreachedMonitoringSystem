const bcrypt = require('bcrypt');

// In-memory user store with a seeded test user
// Password: "password123" hashed with bcrypt
const users = [
  {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    // bcrypt hash of "password123"
    password: '$2b$10$3eo4NHinZEUgNfBdJXrxceEqSMcxVJ.mCgJkp8a/sSxFoJzSIYZdq',
    role: 'user',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

const findUserByEmail = (email) => {
  return users.find((user) => user.email === email) || null;
};

module.exports = { findUserByEmail };
