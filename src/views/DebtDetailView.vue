<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, HandCoins, Trash2 } from 'lucide-vue-next'
import { useDebtsStore } from '../stores/debts'
import { useUiStore } from '../stores/ui'
import { getDebtStatus, statusKey, todayISO } from '../utils/debts'
import { formatDate, formatDueLabel, formatUZS } from '../utils/format'
import { haptic } from '../utils/haptics'

const { t } = useI18n()

const route = useRoute()
const router = useRouter()
const debts = useDebtsStore()
const ui = useUiStore()
const today = todayISO()

const debt = computed(
  () => debts.items.find((item) => item.id === String(route.params.id)) ?? null,
)
const status = computed(() => (debt.value ? getDebtStatus(debt.value, today) : 'open'))

function goBack(): void {
  const state = window.history.state as { back?: string | null } | null
  if (state?.back) router.back()
  else void router.push({ name: 'debts' })
}

function togglePaid(): void {
  if (!debt.value) return
  debts.togglePaid(debt.value.id)
  haptic()
}
</script>

<template>
  <div class="page detail">
    <button class="btn btn--ghost back-btn" type="button" @click="goBack">
      <ArrowLeft :size="17" :stroke-width="1.75" aria-hidden="true" />
      {{ t('detail.back') }}
    </button>

    <template v-if="debt">
      <section class="panel detail-hero" aria-labelledby="detail-person">
        <p id="detail-person" class="detail-hero__person">{{ t('detail.owedTo', { person: debt.person }) }}</p>
        <p class="detail-hero__amount amount">
          {{ formatUZS(debt.amount) }}
        </p>
        <div class="detail-hero__meta">
          <span :class="{ 'text-overdue': status === 'overdue', 'text-paid': status === 'paid' }">
            {{ t(statusKey(status)) }}
          </span>
          <span>{{ t('detail.borrowedOn', { date: formatDate(debt.borrowedAt) }) }}</span>
          <span>{{ debt.dueAt ? t('detail.dueOn', { date: formatDate(debt.dueAt) }) : t('detail.noDueDate') }}</span>
        </div>
      </section>

      <section class="panel detail-panel" aria-labelledby="details-title">
        <div class="panel__head">
          <h2 id="details-title" class="panel__title">{{ t('detail.details') }}</h2>
        </div>
        <dl class="detail-list">
          <div class="detail-row">
            <dt>{{ t('detail.status') }}</dt>
            <dd>{{ t(statusKey(status)) }}</dd>
          </div>
          <div class="detail-row">
            <dt>{{ t('detail.due') }}</dt>
            <dd>
              {{ debt.dueAt ? `${formatDate(debt.dueAt)} · ${formatDueLabel(debt.dueAt, today)}` : t('detail.noDueDate') }}
            </dd>
          </div>
          <div class="detail-row">
            <dt>{{ t('detail.borrowed') }}</dt>
            <dd>{{ formatDate(debt.borrowedAt) }}</dd>
          </div>
          <div class="detail-row">
            <dt>{{ t('detail.recorded') }}</dt>
            <dd>{{ formatDate(debt.createdAt.slice(0, 10)) }}</dd>
          </div>
        </dl>
        <div v-if="debt.note" class="detail-note-block">
          <span class="eyebrow">{{ t('detail.note') }}</span>
          <p class="detail-note">{{ debt.note }}</p>
        </div>
      </section>

      <div class="detail-actions">
        <button class="btn btn--primary" type="button" @click="togglePaid">
          {{ debt.paid ? t('detail.markUnpaid') : t('detail.markPaid') }}
        </button>
        <button v-if="!debt.paid" class="btn btn--ghost" type="button" @click="ui.openRepay()">
          <HandCoins :size="17" :stroke-width="1.75" aria-hidden="true" />
          {{ t('detail.repay') }}
        </button>
        <button class="btn btn--ghost" type="button" @click="ui.openEdit(debt.id)">
          {{ t('detail.edit') }}
        </button>
        <button
          class="btn btn--danger"
          type="button"
          @click="ui.requestDelete(debt.id)"
        >
          <Trash2 :size="17" :stroke-width="1.75" aria-hidden="true" />
          {{ t('detail.delete') }}
        </button>
      </div>
    </template>

    <section v-else class="panel empty-state">
      <p>{{ t('detail.missing') }}</p>
      <button class="btn btn--ghost" type="button" @click="router.push({ name: 'debts' })">
        {{ t('detail.backToDebts') }}
      </button>
    </section>
  </div>
</template>
