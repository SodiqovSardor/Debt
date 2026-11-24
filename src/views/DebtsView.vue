<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { ChevronDown, Search } from 'lucide-vue-next'
import DebtList from '../components/DebtList.vue'
import { useDebtsStore } from '../stores/debts'
import { useUiStore } from '../stores/ui'
import {
  filterDebts,
  groupByPerson,
  searchDebts,
  todayISO,
  totalOutstanding,
} from '../utils/debts'
import { formatUZS } from '../utils/format'
import { haptic } from '../utils/haptics'
import type { DebtFilter } from '../types/debt'

const { t } = useI18n()

const route = useRoute()
const ui = useUiStore()
const debts = useDebtsStore()
const today = todayISO()

const filters = computed<Array<{ id: DebtFilter; label: string }>>(() => [
  { id: 'all', label: t('debts.filter.all') },
  { id: 'open', label: t('debts.filter.open') },
  { id: 'overdue', label: t('debts.filter.overdue') },
  { id: 'paid', label: t('debts.filter.paid') },
])

function readFilter(value: unknown): DebtFilter {
  return filters.value.some((item) => item.id === value) ? (value as DebtFilter) : 'all'
}

const query = ref('')
const filter = ref<DebtFilter>(readFilter(route.query.filter))
const collapsed = ref(new Set<string>())
const searchInput = ref<HTMLInputElement | null>(null)

const filtered = computed(() => filterDebts(searchDebts(debts.items, query.value), filter.value, today))
const groups = computed(() => groupByPerson(filtered.value))
const outstanding = computed(() => totalOutstanding(filtered.value))

watch(
  () => route.query.filter,
  (value) => {
    filter.value = readFilter(value)
  },
)

watch([query, filter], () => {
  collapsed.value = new Set()
})

watch(
  () => ui.searchFocusTick,
  async () => {
    await nextTick()
    searchInput.value?.focus()
    searchInput.value?.select()
  },
)

function isCollapsed(person: string): boolean {
  return collapsed.value.has(person)
}

function toggleGroup(person: string): void {
  const next = new Set(collapsed.value)
  if (next.has(person)) next.delete(person)
  else next.add(person)
  collapsed.value = next
}

function togglePaid(id: string): void {
  debts.togglePaid(id)
  haptic()
}
</script>

<template>
  <div class="page">
    <header class="page-head">
      <div>
        <span class="eyebrow">{{ t('debts.eyebrow') }}</span>
        <h1>{{ t('debts.title') }}</h1>
      </div>
      <span class="page-head__meta">{{ t('debts.people', groups.length) }}</span>
    </header>

    <div class="debts-toolbar">
      <div class="debts-toolbar__search">
        <label class="sr-only" for="debt-search">{{ t('debts.searchLabel') }}</label>
        <div class="search-field">
          <Search :size="18" :stroke-width="1.75" aria-hidden="true" />
          <input
            id="debt-search"
            ref="searchInput"
            v-model="query"
            type="search"
            :placeholder="t('debts.searchPlaceholder')"
            autocomplete="off"
          />
        </div>
      </div>

      <div class="debts-toolbar__chips" role="group" :aria-label="t('debts.filtersLabel')">
        <button
          v-for="item in filters"
          :key="item.id"
          class="chip"
          type="button"
          :aria-pressed="filter === item.id"
          @click="filter = item.id"
        >
          {{ item.label }}
        </button>
      </div>
    </div>

    <section class="panel" :aria-label="t('debts.groupedLabel')">
      <div class="debts-summary">
        <span>{{ t('debts.entries', filtered.length) }}</span>
        <span>
          {{ t('debts.outstanding') }}
          <strong>{{ formatUZS(outstanding) }}</strong>
        </span>
      </div>

      <div v-if="groups.length" class="debt-table">
        <div class="debt-table-head" aria-hidden="true">
          <span>{{ t('debts.person') }}</span>
          <span>{{ t('debts.note') }}</span>
          <span>{{ t('debts.borrowed') }}</span>
          <span>{{ t('debts.due') }}</span>
          <span>{{ t('debts.amount') }}</span>
          <span>{{ t('debts.status') }}</span>
          <span />
        </div>

        <div v-for="(group, index) in groups" :key="group.person" class="debt-group">
          <button
            class="debt-group__head"
            type="button"
            :aria-expanded="!isCollapsed(group.person)"
            :aria-controls="`debt-group-${index}`"
            @click="toggleGroup(group.person)"
          >
            <ChevronDown
              class="debt-group__chevron"
              :class="{ 'is-collapsed': isCollapsed(group.person) }"
              :size="16"
              :stroke-width="1.75"
              aria-hidden="true"
            />
            <span class="debt-group__person">{{ group.person }}</span>
            <span class="debt-group__meta">
              {{ t('debts.groupOpen', group.openCount) }} ·
              {{ formatUZS(group.outstanding) }}
            </span>
          </button>

          <div
            v-show="!isCollapsed(group.person)"
            :id="`debt-group-${index}`"
            class="debt-group__body"
          >
            <DebtList
              :debts="group.debts"
              :label="t('debts.groupLabel', { person: group.person })"
              :empty="t('debts.groupEmpty')"
              @toggle="togglePaid"
            />
          </div>
        </div>
      </div>

      <p v-else class="empty-state">{{ t('debts.noMatches') }}</p>
    </section>
  </div>
</template>
