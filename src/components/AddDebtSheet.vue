<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BottomSheet from './BottomSheet.vue'
import { useDebtsStore } from '../stores/debts'
import { todayISO } from '../utils/debts'
import { haptic } from '../utils/haptics'
import { validateDebt } from '../utils/validation'
import type { DebtDraft, DebtErrors } from '../types/debt'

const { t } = useI18n()

const props = defineProps<{ open: boolean }>()
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

function reset(): void {
  form.person = ''
  form.amount = ''
  form.borrowedAt = todayISO()
  form.dueAt = ''
  form.note = ''
  errors.value = {}
}

watch(
  () => props.open,
  (open) => {
    if (open) reset()
  },
)

function clearError(field: keyof DebtDraft): void {
  if (!errors.value[field]) return
  errors.value = { ...errors.value, [field]: undefined }
}

function submit(): void {
  const nextErrors = validateDebt(form)
  errors.value = nextErrors
  if (Object.keys(nextErrors).length > 0) return

  debts.addDebt(form)
  haptic()
  emit('close')
}
</script>

<template>
  <BottomSheet
    :open="open"
    :title="t('debts.addTitle')"
    :description="t('debts.addDescription')"
    @close="emit('close')"
  >
    <form class="sheet-form" novalidate @submit.prevent="submit">
      <div class="field" :class="{ 'field--error': errors.person }">
        <label for="add-person">{{ t('debts.personLabel') }}</label>
        <input
          id="add-person"
          v-model="form.person"
          type="text"
          autocomplete="off"
          :placeholder="t('debts.personPlaceholder')"
          :aria-invalid="Boolean(errors.person)"
          :aria-describedby="errors.person ? 'add-person-error' : undefined"
          data-autofocus
          @input="clearError('person')"
        />
        <p v-if="errors.person" id="add-person-error" class="field-error">
          {{ t(errors.person) }}
        </p>
      </div>

      <div class="field" :class="{ 'field--error': errors.amount }">
        <label for="add-amount">{{ t('debts.amountLabel') }}</label>
        <input
          id="add-amount"
          v-model="form.amount"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          :placeholder="t('debts.amountPlaceholder')"
          :aria-invalid="Boolean(errors.amount)"
          :aria-describedby="errors.amount ? 'add-amount-error' : undefined"
          @input="clearError('amount')"
        />
        <p v-if="errors.amount" id="add-amount-error" class="field-error">
          {{ t(errors.amount) }}
        </p>
      </div>

      <div class="sheet-form__row">
        <div class="field" :class="{ 'field--error': errors.borrowedAt }">
          <label for="add-borrowed">{{ t('debts.borrowedLabel') }}</label>
          <input
            id="add-borrowed"
            v-model="form.borrowedAt"
            type="date"
            :aria-invalid="Boolean(errors.borrowedAt)"
            :aria-describedby="errors.borrowedAt ? 'add-borrowed-error' : undefined"
            @input="clearError('borrowedAt')"
          />
          <p v-if="errors.borrowedAt" id="add-borrowed-error" class="field-error">
            {{ t(errors.borrowedAt) }}
          </p>
        </div>

        <div class="field" :class="{ 'field--error': errors.dueAt }">
          <label for="add-due">{{ t('debts.dueLabel') }}</label>
          <input
            id="add-due"
            v-model="form.dueAt"
            type="date"
            :min="form.borrowedAt"
            :aria-invalid="Boolean(errors.dueAt)"
            :aria-describedby="errors.dueAt ? 'add-due-error' : undefined"
            @input="clearError('dueAt')"
          />
          <p v-if="errors.dueAt" id="add-due-error" class="field-error">
            {{ t(errors.dueAt) }}
          </p>
        </div>
      </div>

      <div class="field" :class="{ 'field--error': errors.note }">
        <label for="add-note">{{ t('debts.noteLabel') }}</label>
        <textarea
          id="add-note"
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
        <button class="btn btn--primary" type="submit">{{ t('debts.addAction') }}</button>
      </div>
    </form>
  </BottomSheet>
</template>
