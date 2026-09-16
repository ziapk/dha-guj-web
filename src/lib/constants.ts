/**
 * httpOnly cookie holding the Laravel user token. It has the same name as in Property Admin,
 * so logging in on either site logs the user in on both (set SESSION_COOKIE_DOMAIN in production).
 */
export const TOKEN_COOKIE = "portal_token";
