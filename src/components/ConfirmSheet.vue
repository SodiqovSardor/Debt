<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import BottomSheet from './BottomSheet.vue'

const { t } = useI18n()

withDefaults(
  defineProps<{
    open: boolean
    title: string
    message: string
    confirmLabel?: string
  }>(),
  { confirmLabel: 'Delete' },
)

const emit = defineEmits<{ confirm: []; close: [] }>()
</script>

<template>
  <BottomSheet :open="open" :title="title" @close="emit('close')">
    <p class="sheet-copy">{{ message }}</p>
    <div class="sheet-actions">
      <button class="btn btn--ghost" type="button" @click="emit('close')">
        {{ t('app.cancel') }}
      </button>
      <button class="btn btn--danger" type="button" @click="emit('confirm')">
        {{ confirmLabel }}
      </button>
    </div>
  </BottomSheet>
</template>
