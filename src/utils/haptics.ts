/**
 * A no-op on browsers without the Vibration API. If Capacitor Haptics is added
 * later, call its impact API here instead of the web fallback.
 */
export function haptic(): void {
  navigator.vibrate?.(8)
}
