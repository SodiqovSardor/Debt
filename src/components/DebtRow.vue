<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import CheckBurst from './CheckBurst.vue'
import { getDebtStatus, statusKey, todayISO } from '../utils/debts'
import { formatShortDate, formatUZS } from '../utils/format'
import type { Debt } from '../types/debt'

const { t } = useI18n()

const props = defineProps<{ debt: Debt }>()
const emit = defineEmits<{ toggle: [id: string] }>()

const today = todayISO()

const status = computed(() => getDebtStatus(props.debt, today))
const dueLabel = computed(() =>
  props.debt.dueAt ? formatShortDate(props.debt.dueAt) : t('format.noDueDate'),
)
const toggleLabel = computed(() =>
  props.debt.paid
    ? t('detail.toggleUnpaid', { person: props.debt.person })
    : t('detail.togglePaid', { person: props.debt.person }),
)
</script>

<template>
  <div class="debt-row" :class="{ 'is-paid': debt.paid }">
    <div class="debt-row__body">
      <div class="debt-row__main">
        <RouterLink class="debt-row__person" :to="{ name: 'debt-detail', params: { id: debt.id } }">
          {{ debt.person }}
        </RouterLink>
        <span v-if="debt.note" class="debt-row__note">{{ debt.note }}</span>
      </div>

      <div class="debt-row__meta">
        <span class="debt-row__borrowed">{{ formatShortDate(debt.borrowedAt) }}</span>
        <span class="debt-row__due" :class="{ 'is-overdue': status === 'overdue' }">
          {{ dueLabel }}
        </span>
        <span
          class="debt-row__status"
          :class="{ 'is-overdue': status === 'overdue', 'is-paid': status === 'paid' }"
        >
          {{ t(statusKey(status)) }}
        </span>
      </div>

      <span class="debt-row__amount amount">
        {{ formatUZS(debt.amount) }}
      </span>
    </div>

    <div class="debt-row__actions">
      <button
        class="icon-btn debt-toggle"
        :class="{ 'debt-toggle--paid': debt.paid }"
        type="button"
        :aria-label="toggleLabel"
        :aria-pressed="debt.paid"
        @click="emit('toggle', debt.id)"
      >
        <CheckBurst v-if="debt.paid" :active="debt.paid" />
        <span v-else class="debt-toggle__ring" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
