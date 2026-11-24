<script setup lang="ts">
import { nextTick, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BottomSheet from './BottomSheet.vue'
import { useDebtsStore } from '../stores/debts'
import { todayISO } from '../utils/debts'
import { haptic } from '../utils/haptics'
import { validateDebt } from '../utils/validation'
import type { Debt, DebtDraft, DebtErrors } from '../types/debt'

const { t } = useI18n()

const props = defineProps<{
  open: boolean
  debtId: string | null
}>()

const emit = defineEmits<{ close: [] }>()

const debts = useDebtsStore()
const errors = ref<DebtErrors>({})

const form = reactive<DebtDraft>({
  person: '',
  amount: '',
  borrowedAt: todayISO(),
  dueAt: '',
  note: '',
})

let source: Debt | null = null

function reset(): void {
  source = null
  form.person = ''
  form.amount = ''
  form.borrowedAt = todayISO()
  form.dueAt = ''
  form.note = ''
  errors.value = {}
}

function loadDebt(debt: Debt): void {
  source = debt
  form.person = debt.person
  form.amount = String(debt.amount)
  form.borrowedAt = debt.borrowedAt
  form.dueAt = debt.dueAt ?? ''
  form.note = debt.note
  errors.value = {}
}

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      reset()
      return
    }
    reset()
    if (!props.debtId) return
    await nextTick()
    const debt = debts.items.find((item) => item.id === props.debtId) ?? null
    if (debt) loadDebt(debt)
    else emit('close')
  },
)

function clearError(field: keyof DebtDraft): void {
  if (!errors.value[field]) return
  errors.value = { ...errors.value, [field]: undefined }
}

async function submit(): Promise<void> {
  const nextErrors = validateDebt(form)
  errors.value = nextErrors
  if (Object.keys(nextErrors).length > 0) return

  if (!source) return
  const updated = debts.updateDebt(source.id, form)
  if (!updated) return

  haptic()
  emit('close')
}
</script>

<template>
  <BottomSheet
    :open="open"
    :title="t('debts.editTitle')"
    :description="t('debts.editDescription')"
    @close="emit('close')"
  >
    <form class="sheet-form" novalidate @submit.prevent="submit">
      <div class="field" :class="{ 'field--error': errors.person }">
        <label for="edit-person">{{ t('debts.personLabel') }}</label>
        <input
          id="edit-person"
          v-model="form.person"
          type="text"
          autocomplete="off"
          :placeholder="t('debts.personPlaceholder')"
          :aria-invalid="Boolean(errors.person)"
          :aria-describedby="errors.person ? 'edit-person-error' : undefined"
          data-autofocus
          @input="clearError('person')"
        />
        <p v-if="errors.person" id="edit-person-error" class="field-error">
          {{ t(errors.person) }}
        </p>
      </div>

      <div class="field" :class="{ 'field--error': errors.amount }">
        <label for="edit-amount">{{ t('debts.amountLabel') }}</label>
        <input
          id="edit-amount"
          v-model="form.amount"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          :placeholder="t('debts.amountPlaceholder')"
          :aria-invalid="Boolean(errors.amount)"
          :aria-describedby="errors.amount ? 'edit-amount-error' : undefined"
          @input="clearError('amount')"
        />
        <p v-if="errors.amount" id="edit-amount-error" class="field-error">
          {{ t(errors.amount) }}
        </p>
      </div>

      <div class="sheet-form__row">
        <div class="field" :class="{ 'field--error': errors.borrowedAt }">
          <label for="edit-borrowed">{{ t('debts.borrowedLabel') }}</label>
          <input
            id="edit-borrowed"
            v-model="form.borrowedAt"
            type="date"
            :aria-invalid="Boolean(errors.borrowedAt)"
            :aria-describedby="errors.borrowedAt ? 'edit-borrowed-error' : undefined"
            @input="clearError('borrowedAt')"
          />
          <p v-if="errors.borrowedAt" id="edit-borrowed-error" class="field-error">
            {{ t(errors.borrowedAt) }}
          </p>
        </div>

        <div class="field" :class="{ 'field--error': errors.dueAt }">
          <label for="edit-due">{{ t('debts.dueLabel') }}</label>
          <input
            id="edit-due"
            v-model="form.dueAt"
            type="date"
            :min="form.borrowedAt"
            :aria-invalid="Boolean(errors.dueAt)"
            :aria-describedby="errors.dueAt ? 'edit-due-error' : undefined"
            @input="clearError('dueAt')"
          />
          <p v-if="errors.dueAt" id="edit-due-error" class="field-error">
            {{ t(errors.dueAt) }}
          </p>
        </div>
      </div>

      <div class="field" :class="{ 'field--error': errors.note }">
        <label for="edit-note">{{ t('debts.noteLabel') }}</label>
        <textarea
          id="edit-note"
          v-model="form.note"
          rows="2"
          :placeholder="t('debts.notePlaceholder')"
          @input="clearError('note')"
        />
        <p v-if="errors.note" class="field-error">{{ t(errors.note) }}</p>
      </div>

      <div class="sheet-actions">
        <button class="btn btn--ghost" type="button" @click="emit('close')">
          {{ t('app.cancel') }}
        </button>
        <button class="btn btn--primary" type="submit">{{ t('debts.saveAction') }}</button>
      </div>
    </form>
  </BottomSheet>
</template>
