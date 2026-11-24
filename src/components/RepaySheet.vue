<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import BottomSheet from './BottomSheet.vue'
import { useDebtsStore } from '../stores/debts'
import { sortByDueDate, todayISO } from '../utils/debts'
import { formatDueLabel, formatUZS } from '../utils/format'
import { haptic } from '../utils/haptics'

const { t } = useI18n()

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const router = useRouter()
const debts = useDebtsStore()
const today = todayISO()

const pending = computed(() => sortByDueDate(debts.items.filter((debt) => !debt.paid)))

function settle(id: string): void {
  debts.togglePaid(id)
  haptic()
  emit('close')
}

function view(id: string): void {
  emit('close')
  void router.push({ name: 'debt-detail', params: { id } })
}
</script>

<template>
  <BottomSheet
    :open="open"
    :title="t('repay.title')"
    :description="t('repay.description')"
    @close="emit('close')"
  >
    <ul v-if="pending.length" class="sheet-debt-list">
      <li v-for="debt in pending" :key="debt.id" class="sheet-debt">
        <div class="sheet-debt__copy">
          <button class="link-btn sheet-debt__person" type="button" @click="view(debt.id)">
            {{ debt.person }}
          </button>
          <span class="sheet-debt__meta">{{ formatDueLabel(debt.dueAt, today) }}</span>
        </div>
        <span class="sheet-debt__amount amount">
          {{ formatUZS(debt.amount) }}
        </span>
        <button class="btn btn--ghost btn--small" type="button" @click="settle(debt.id)">
          {{ t('repay.markPaid') }}
        </button>
      </li>
    </ul>
    <p v-else class="empty-state">{{ t('repay.empty') }}</p>
  </BottomSheet>
</template>
