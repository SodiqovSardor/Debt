/** All security timings and limits live here so tests and UI stay in sync. */
export const STORAGE_PREFIX = 'debts.'

export const PASSWORD_ITERATIONS = 310_000
export const PIN_ITERATIONS = 210_000

export const SALT_BYTES = 16
export const IV_BYTES = 12
export const DEK_BYTES = 32

export const PIN_MIN_LENGTH = 4
export const PIN_MAX_LENGTH = 6
export const PIN_DOT_COUNT = 6

/** Five wrong PINs lock the keypad for one minute. */
export const PIN_ATTEMPTS_BEFORE_LOCK = 5
/** Ten wrong PINs retire the PIN and force the password path. */
export const PIN_ATTEMPTS_BEFORE_PASSWORD = 10
export const PIN_LOCKOUT_MS = 60_000

/** Backgrounding for more than one minute locks the session. */
export const HIDDEN_LOCK_MS = 60_000
/** Five minutes without interaction locks the session. */
export const IDLE_LOCK_MS = 5 * 60_000

export const ACCOUNT_KEY = `${STORAGE_PREFIX}account`
export const VAULT_KEY = `${STORAGE_PREFIX}vault`
export const ATTEMPTS_KEY = `${STORAGE_PREFIX}attempts`
export const LOCALE_KEY = `${STORAGE_PREFIX}locale`
export const THEME_KEY = `${STORAGE_PREFIX}theme`
