const crypto = require('crypto');

/**
 * A bcrypt replacement using Node's built-in crypto module.
 * This is used when bcrypt native module has platform compatibility issues.
 */

/**
 * Generate a salt for password hashing
 * @param {number} rounds - Number of rounds (ignored, just for bcrypt compatibility)
 * @returns {string} - Generated salt
 */
const genSalt = async (rounds = 10) => {
  // Generate a random salt (32 bytes converted to hex = 64 characters)
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash a password with the given salt
 * @param {string} password - The password to hash
 * @param {string} salt - The salt to use
 * @returns {string} - The hashed password
 */
const hash = async (password, salt) => {
  // Create a hash using sha512 with 100000 iterations
  const hashedPassword = crypto.pbkdf2Sync(
    password,
    salt,
    100000, // iterations
    64,     // key length
    'sha512'
  ).toString('hex');
  
  // Store both salt and hash to allow verification later
  return `${salt}:${hashedPassword}`;
};

/**
 * Compare a plaintext password with a hash
 * @param {string} password - The plaintext password
 * @param {string} hashedPassword - The hash to compare against
 * @returns {boolean} - True if the password matches the hash
 */
const compare = async (password, hashedPassword) => {
  try {
    // Split the stored hash into salt and hash
    const [salt, originalHash] = hashedPassword.split(':');
    
    // Hash the input password with the same salt
    const hashedInput = crypto.pbkdf2Sync(
      password,
      salt,
      100000, // must use same iterations
      64,     // must use same key length
      'sha512'
    ).toString('hex');
    
    // Compare the generated hash with the stored hash
    return hashedInput === originalHash;
  } catch (error) {
    // If there's any error in the format or processing, return false
    return false;
  }
};

module.exports = {
  genSalt,
  hash,
  compare
}; 