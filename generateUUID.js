const { randomUUID } = require("crypto");

/**
 * Generates a valid UUID for transaction reference.
 * @returns {string} A new UUID.
 */
const generateUUID = () => {
  return randomUUID();
};

module.exports = generateUUID;
