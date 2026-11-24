<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale, getLocale } from '../i18n'

const { t } = useI18n()

const current = computed(() => getLocale())

const LOCALES: Array<{ code: 'uz' | 'ru' | 'en'; label: string }> = [
  { code: 'uz', label: 'UZ' },
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
]

function select(code: string): void {
  setLocale(code as 'uz' | 'ru' | 'en')
}
</script>

<template>
  <div class="language-switch" role="group" :aria-label="t('app.language.label')">
    <button
      v-for="locale in LOCALES"
      :key="locale.code"
      class="language-switch__button"
      :class="{ 'language-switch__button--active': current === locale.code }"
      type="button"
      lang="en"
      :aria-pressed="current === locale.code"
      @click="select(locale.code)"
    >
      {{ locale.label }}
    </button>
  </div>
</template>

<style scoped>
.language-switch {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  background: var(--raised);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-pill);
}

.language-switch__button {
  display: grid;
  min-width: 38px;
  min-height: 30px;
  padding: 0 8px;
  place-items: center;
  background: transparent;
  border: 0;
  border-radius: var(--radius-pill);
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  cursor: pointer;
  touch-action: manipulation;
  transition: color 150ms var(--ease-out), background-color 150ms var(--ease-out);
}

.language-switch__button--active {
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow-lift);
}

@media (hover: hover) and (pointer: fine) {
  .language-switch__button:hover {
    color: var(--text);
  }
}

@media (pointer: coarse) {
  .language-switch__button {
    min-width: 44px;
    min-height: 40px;
    font-size: 12px;
  }
}
</style>
