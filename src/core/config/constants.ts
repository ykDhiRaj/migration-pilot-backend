/**
 * App-wide constants. Put here anything that is not secret
 * (secrets go in .env) but is referenced across multiple modules.
 */
export const CONSTANTS = {
  BCRYPT_ROUNDS: 12,

  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 200,
  },

  // Bump this string to instantly invalidate all existing JWTs
  JWT_VERSION: 'v1',
} as const;
