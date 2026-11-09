/** Active sessions renew every five minutes; sensitive actions still require a recent login. */
export const SESSION_POLICY = {
  expiresIn: 8 * 60 * 60,
  updateAge: 5 * 60,
  freshAge: 30 * 60,
}
export const SESSION_CHECK_INTERVAL_MS = 4 * 60 * 1000
export const SESSION_ACTIVITY_WINDOW_MS = 10 * 60 * 1000
