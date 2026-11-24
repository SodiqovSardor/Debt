<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ThreeBackdrop from './ThreeBackdrop.vue'
import { useCountUp } from '../composables/useCountUp'
import { useDebtsStore } from '../stores/debts'
import { formatUZS } from '../utils/format'

const { t } = useI18n()

const debts = useDebtsStore()

const total = computed(() => debts.total)
const display = useCountUp(total)
const amount = computed(() => formatUZS(Math.round(display.value)))
const dueThisWeek = computed(() => debts.upcoming.length)
const overdueCount = computed(() => debts.overdue.length)
</script>

<template>
  <section class="hero-card" aria-labelledby="hero-total-label">
    <ThreeBackdrop />
    <div class="hero-card__content">
      <div>
        <p id="hero-total-label" class="hero-card__label">{{ t('home.totalOwed') }}</p>
        <p class="hero-card__amount amount">{{ amount }}</p>
      </div>
      <p class="hero-card__meta">
        <span>{{ t('home.open', debts.openCount) }}</span>
        <span>{{ t('home.dueThisWeek', dueThisWeek) }}</span>
        <span v-if="overdueCount > 0" class="text-overdue">
          {{ t('home.overdue', overdueCount) }}
        </span>
      </p>
    </div>
  </section>
</template>
