<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { ChartPie, House, Plus, ReceiptText, UserRound } from 'lucide-vue-next'
import { motion } from 'motion-v'
import { springTab } from '../motion/presets'
import { useUiStore } from '../stores/ui'
import type { TabId } from '../types/debt'

const { t } = useI18n()

const route = useRoute()
const router = useRouter()
const ui = useUiStore()

// A computed list keeps the labels in sync when the language changes.
const tabs = computed(() => [
  { id: 'home' as const, label: t('app.nav.home'), icon: House, name: 'home' },
  { id: 'debts' as const, label: t('app.nav.debts'), icon: ReceiptText, name: 'debts' },
  { id: 'insights' as const, label: t('app.nav.insights'), icon: ChartPie, name: 'insights' },
  { id: 'profile' as const, label: t('app.nav.profile'), icon: UserRound, name: 'profile' },
])

const active = computed<TabId>(() => (route.meta.tab as TabId | undefined) ?? 'home')

function go(name: string): void {
  void router.push({ name })
}
</script>

<template>
  <nav class="tabbar" :aria-label="t('app.nav.primary')">
    <span class="tabbar__brand serif-display" aria-hidden="true">{{ t('app.name') }}</span>

    <button
      class="tabbar__fab"
      type="button"
      :aria-label="t('app.addDebt')"
      @click="ui.openAdd()"
    >
      <Plus :size="22" :stroke-width="1.75" aria-hidden="true" />
      <span class="tabbar__fab-label">{{ t('app.addDebt') }}</span>
    </button>

    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="tab"
      :class="[`tab--${tab.id}`, { 'tab--active': active === tab.id }]"
      type="button"
      :aria-current="active === tab.id ? 'page' : undefined"
      @click="go(tab.name)"
    >
      <motion.span
        v-if="active === tab.id"
        layout-id="tab-pill"
        class="tab__pill"
        :transition="springTab"
        aria-hidden="true"
      />
      <component
        :is="tab.icon"
        class="tab__icon"
        :size="21"
        :stroke-width="1.75"
        aria-hidden="true"
      />
      <span class="tab__label">{{ tab.label }}</span>
    </button>
  </nav>
</template>
