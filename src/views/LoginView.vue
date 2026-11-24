<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Eye, EyeOff } from 'lucide-vue-next'
import LanguageSwitch from '../components/LanguageSwitch.vue'
import { useSessionStore } from '../stores/session'

const { t } = useI18n()

const router = useRouter()
const session = useSessionStore()

const showPassword = ref(false)
const submitting = ref(false)
const error = ref<string | null>(null)

const form = reactive({
  username: '',
  password: '',
})

onMounted(() => {
  // The account name is known locally; asking the user to retype it is only
  // friction, so it starts filled in and stays editable.
  form.username = session.username
})

async function submit(): Promise<void> {
  error.value = null

  if (!form.password) {
    error.value = t('auth.passwordRequired')
    return
  }

  submitting.value = true
  try {
    await session.login(form.password)
    void router.replace({ name: session.hasPin ? 'home' : 'setup-pin' })
  } catch {
    // One generic message, so a failed attempt never reveals anything.
    error.value = t('auth.loginError')
  } finally {
    submitting.value = false
  }
}

function goSignup(): void {
  void router.push({ name: 'signup' })
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-topbar">
      <LanguageSwitch />
    </div>

    <header class="auth-masthead">
      <p class="auth-brand serif-display">{{ t('app.name') }}</p>
      <p class="auth-tagline">{{ t('auth.loginTitle') }}</p>
    </header>

    <main class="auth-body">
      <form class="auth-form" novalidate @submit.prevent="submit">
        <p class="auth-form__lead">{{ t('auth.loginSubtitle') }}</p>

        <div class="auth-field">
          <label class="auth-field__label" for="login-username">{{ t('auth.username') }}</label>
          <div class="auth-field__control">
            <input
              id="login-username"
              v-model="form.username"
              type="text"
              autocomplete="username"
              autocapitalize="none"
              spellcheck="false"
            />
          </div>
        </div>

        <div class="auth-field">
          <label class="auth-field__label" for="login-password">{{ t('auth.password') }}</label>
          <div class="auth-field__control">
            <input
              id="login-password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
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

        <p v-if="error" class="auth-error" role="alert">{{ error }}</p>

        <button class="btn btn--primary auth-submit" type="submit" :disabled="submitting">
          <span v-if="submitting" class="btn__pulse" aria-hidden="true" />
          {{ t('auth.loginAction') }}
        </button>
      </form>

      <p class="auth-switch">
        <span>{{ t('auth.noAccount') }}</span>
        <button type="button" class="auth-link" @click="goSignup">
          {{ t('auth.switchToSignup') }}
        </button>
      </p>
    </main>
  </div>
</template>
