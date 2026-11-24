<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Eye, EyeOff, ShieldAlert } from 'lucide-vue-next'
import LanguageSwitch from '../components/LanguageSwitch.vue'
import { useSessionStore } from '../stores/session'

const { t } = useI18n()

const router = useRouter()
const session = useSessionStore()

const showPassword = ref(false)
const accepting = ref(false)
const submitting = ref(false)
const error = ref<string | null>(null)
const mismatch = ref(false)

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
})

function clearError(): void {
  error.value = null
  mismatch.value = false
}

async function submit(): Promise<void> {
  error.value = null
  mismatch.value = false

  if (!form.username.trim()) {
    error.value = t('auth.usernameRequired')
    return
  }
  if (!form.password) {
    error.value = t('auth.passwordRequired')
    return
  }
  if (form.password !== form.confirmPassword) {
    mismatch.value = true
    error.value = t('auth.passwordMismatch')
    return
  }
  if (!accepting.value) {
    error.value = t('auth.acceptRequired')
    return
  }

  submitting.value = true
  try {
    await session.signup(form.username.trim(), form.password)
    void router.replace({ name: 'setup-pin' })
  } catch {
    error.value = t('auth.signupError')
  } finally {
    submitting.value = false
  }
}

function goLogin(): void {
  void router.push({ name: 'login' })
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-topbar">
      <LanguageSwitch />
    </div>

    <header class="auth-masthead">
      <p class="auth-brand serif-display">{{ t('app.name') }}</p>
      <p class="auth-tagline">{{ t('auth.signupTitle') }}</p>
    </header>

    <main class="auth-body">
      <form class="auth-form" novalidate @submit.prevent="submit">
        <p class="auth-form__lead">{{ t('auth.signupSubtitle') }}</p>

        <div class="auth-field">
          <label class="auth-field__label" for="signup-username">{{ t('auth.username') }}</label>
          <div class="auth-field__control">
            <input
              id="signup-username"
              v-model="form.username"
              type="text"
              autocomplete="username"
              autocapitalize="none"
              spellcheck="false"
              @input="clearError"
            />
          </div>
        </div>

        <div class="auth-field">
          <label class="auth-field__label" for="signup-password">{{ t('auth.password') }}</label>
          <div class="auth-field__control">
            <input
              id="signup-password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              @input="clearError"
            />
            <button
              type="button"
              class="auth-field__toggle"
              :aria-label="showPassword ? t('auth.hidePassword') : t('auth.showPassword')"
              :aria-pressed="showPassword"
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="showPassword" :size="18" :stroke-width="1.75" aria-hidden="true" />
              <Eye v-else :size="18" :stroke-width="1.75" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div class="auth-field" :class="{ 'auth-field--error': mismatch }">
          <label class="auth-field__label" for="signup-confirm">{{ t('auth.confirmPassword') }}</label>
          <div class="auth-field__control">
            <input
              id="signup-confirm"
              v-model="form.confirmPassword"
              type="password"
              autocomplete="new-password"
              @input="clearError"
            />
          </div>
        </div>

        <p v-if="error" class="auth-error" role="alert">{{ error }}</p>

        <div class="auth-warning">
          <ShieldAlert :size="18" :stroke-width="1.75" aria-hidden="true" />
          <div>
            <strong>{{ t('auth.noRecoveryTitle') }}</strong>
            <p>{{ t('auth.noRecoveryBody') }}</p>
          </div>
        </div>

        <label class="auth-consent" for="signup-accept">
          <input id="signup-accept" v-model="accepting" type="checkbox" />
          <span>{{ t('auth.understand') }}</span>
        </label>

        <button class="btn btn--primary auth-submit" type="submit" :disabled="submitting">
          <span v-if="submitting" class="btn__pulse" aria-hidden="true" />
          {{ t('auth.createAction') }}
        </button>
      </form>

      <p class="auth-switch">
        <span>{{ t('auth.haveAccount') }}</span>
        <button type="button" class="auth-link" @click="goLogin">
          {{ t('auth.switchToLogin') }}
        </button>
      </p>
    </main>
  </div>
</template>
