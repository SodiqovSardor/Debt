<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { getDebtStatus, sortByDueDate, todayISO } from '../utils/debts'
import { formatDate, formatDueLabel, formatUZS } from '../utils/format'
import type { Debt } from '../types/debt'

const { t } = useI18n()

const props = defineProps<{ debts: Debt[] }>()

const today = todayISO()
const items = computed(() =>
  sortByDueDate(props.debts.filter((debt) => !debt.paid && debt.dueAt !== null)),
)
</script>

<template>
  <ul v-if="items.length" class="timeline">
    <li
      v-for="debt in items"
      :key="debt.id"
      class="timeline__item"
      :class="{ 'is-overdue': getDebtStatus(debt, today) === 'overdue' }"
    >
      <span class="timeline__dot" aria-hidden="true" />
      <div class="timeline__body">
        <RouterLink
          class="timeline__person"
          :to="{ name: 'debt-detail', params: { id: debt.id } }"
        >
          {{ debt.person }}
        </RouterLink>
        <span class="timeline__date">
          {{ formatDate(debt.dueAt) }} · {{ formatDueLabel(debt.dueAt, today) }}
        </span>
      </div>
      <span class="timeline__amount amount">
        {{ formatUZS(debt.amount) }}
      </span>
    </li>
  </ul>
  <p v-else class="empty-state">{{ t('insights.emptyTimeline') }}</p>
</template>
