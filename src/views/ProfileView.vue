<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { LogOut, Moon, Sun } from 'lucide-vue-next'
import LanguageSwitch from '../components/LanguageSwitch.vue'
import { useSettingsStore } from '../stores/settings'
import { useSessionStore } from '../stores/session'

const { t } = useI18n()

const router = useRouter()
const settings = useSettingsStore()
const session = useSessionStore()

const deleteWord = ref('')
const deleting = ref(false)
const deleteError = ref<string | null>(null)
const signingOut = ref(false)

async function confirmDeleteAll(): Promise<void> {
  if (deleteWord.value !== t('profile.deleteWord')) {
    deleteError.value = t('profile.deleteInstruction')
    return
  }

  deleting.value = true
  deleteError.value = null
  try {
    await session.deleteAllData()
    deleteWord.value = ''
    await router.replace({ name: 'signup' })
  } catch {
    deleteError.value = t('profile.deleteAction')
  } finally {
    deleting.value = false
  }
}

async function signOut(): Promise<void> {
  signingOut.value = true
  try {
    await session.signOut()
    await router.replace({ name: 'login' })
  } finally {
    signingOut.value = false
  }
}
</script>

<template>
  <div class="page">
    <header class="page-head">
      <div>
        <span class="eyebrow">{{ t('profile.eyebrow') }}</span>
        <h1>{{ t('profile.title') }}</h1>
      </div>
    </header>

    <section class="panel profile-card" aria-labelledby="appearance-title">
      <h2 id="appearance-title" class="panel__title profile-card__title">
        {{ t('profile.appearance') }}
      </h2>

      <div class="setting-row">
        <div class="setting-row__copy">
          <span class="setting-row__label">{{ t('profile.theme') }}</span>
          <span class="setting-row__hint">{{ t('profile.themeHint') }}</span>
        </div>
        <div class="segmented" role="group" :aria-label="t('profile.theme')">
          <button
            type="button"
            :aria-pressed="settings.theme === 'dark'"
            @click="settings.setTheme('dark')"
          >
            <Moon :size="15" :stroke-width="1.75" aria-hidden="true" />
            {{ t('app.theme.dark') }}
          </button>
          <button
            type="button"
            :aria-pressed="settings.theme === 'light'"
            @click="settings.setTheme('light')"
          >
            <Sun :size="15" :stroke-width="1.75" aria-hidden="true" />
            {{ t('app.theme.light') }}
          </button>
        </div>
      </div>
    </section>

    <section class="panel profile-card" aria-labelledby="language-title">
      <h2 id="language-title" class="panel__title profile-card__title">
        {{ t('profile.language') }}
      </h2>

      <div class="setting-row">
        <span class="setting-row__hint">{{ t('profile.languageHint') }}</span>
        <LanguageSwitch />
      </div>
    </section>

    <section class="panel profile-card" aria-labelledby="account-title">
      <h2 id="account-title" class="panel__title profile-card__title">
        {{ t('profile.security') }}
      </h2>

      <div class="setting-row">
        <div class="setting-row__copy">
          <span class="setting-row__label">
            {{ t('profile.signedInAs', { username: session.username }) }}
          </span>
          <span class="setting-row__hint">{{ t('profile.signOutHint') }}</span>
        </div>
        <button class="btn btn--ghost" type="button" :disabled="signingOut" @click="signOut">
          <LogOut :size="16" :stroke-width="1.75" aria-hidden="true" />
          {{ t('profile.signOut') }}
        </button>
      </div>
    </section>

    <section class="panel profile-card" aria-labelledby="data-title">
      <h2 id="data-title" class="panel__title profile-card__title">{{ t('profile.data') }}</h2>

      <div class="setting-row">
        <div class="setting-row__copy">
          <span class="setting-row__label">{{ t('profile.deleteAll') }}</span>
          <span class="setting-row__hint">{{ t('profile.deleteHint') }}</span>
        </div>
      </div>

      <div class="profile-danger">
        <label class="sr-only" for="delete-confirm">{{ t('profile.deleteInputLabel') }}</label>
        <input
          id="delete-confirm"
          v-model="deleteWord"
          class="profile-danger__input"
          type="text"
          autocomplete="off"
          autocapitalize="characters"
          spellcheck="false"
          :placeholder="t('profile.deleteWord')"
          maxlength="12"
        />
        <button
          class="btn btn--danger"
          type="button"
          :disabled="deleting || deleteWord !== t('profile.deleteWord')"
          @click="confirmDeleteAll"
        >
          {{ t('profile.deleteAction') }}
        </button>
        <p class="setting-row__hint">{{ t('profile.deleteInstruction') }}</p>
      </div>

      <p v-if="deleteError" class="import-status is-error" role="alert">{{ deleteError }}</p>
    </section>
  </div>
</template>

<style scoped>
.profile-card .import-status {
  padding: 0 0 18px;
  color: var(--text-secondary);
  font-size: 13px;
}
</style>
