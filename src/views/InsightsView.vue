<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import DonutChart from '../components/DonutChart.vue'
import DueTimeline from '../components/DueTimeline.vue'
import { useDebtsStore } from '../stores/debts'
import { groupByPerson, totalOutstanding } from '../utils/debts'
import { formatUZS } from '../utils/format'

const { t } = useI18n()

const router = useRouter()
const debts = useDebtsStore()

const openDebts = computed(() => debts.items.filter((debt) => !debt.paid))
const groups = computed(() =>
  groupByPerson(openDebts.value).filter((group) => group.outstanding > 0),
)
const overdueTotal = computed(() => totalOutstanding(debts.overdue))
const scheduledCount = computed(() => openDebts.value.filter((debt) => debt.dueAt !== null).length)

function reviewOverdue(): void {
  void router.push({ name: 'debts', query: { filter: 'overdue' } })
}
</script>

<template>
  <div class="page">
    <header class="page-head">
      <div>
        <span class="eyebrow">{{ t('insights.eyebrow') }}</span>
        <h1>{{ t('insights.title') }}</h1>
      </div>
    </header>

    <div class="insights-grid">
      <section
        v-if="debts.overdue.length"
        class="overdue-callout insights-grid__wide"
        aria-labelledby="overdue-title"
      >
        <span id="overdue-title" class="overdue-callout__label">{{ t('insights.overdue') }}</span>
        <strong class="amount">
          {{ formatUZS(overdueTotal) }}
        </strong>
        <p>
          {{ t('insights.overdueSummary', { n: debts.overdue.length }) }}
        </p>
        <button class="btn btn--ghost" type="button" @click="reviewOverdue">
          {{ t('insights.reviewOverdue') }}
        </button>
      </section>

      <section class="panel" aria-labelledby="by-person-title">
        <div class="panel__head">
          <h2 id="by-person-title" class="panel__title">{{ t('insights.byPerson') }}</h2>
          <span class="panel__link">{{ t('insights.people', groups.length) }}</span>
        </div>
        <DonutChart :groups="groups" />
      </section>

      <section class="panel" aria-labelledby="due-dates-title">
        <div class="panel__head">
          <h2 id="due-dates-title" class="panel__title">{{ t('insights.dueDates') }}</h2>
          <span class="panel__link">{{ t('insights.scheduled', scheduledCount) }}</span>
        </div>
        <DueTimeline :debts="openDebts" />
      </section>
    </div>
  </div>
</template>
