<script setup lang="ts">
import { nextTick, onBeforeUnmount, useId, watch, type ComponentPublicInstance } from 'vue'
import { useI18n } from 'vue-i18n'
import { AnimatePresence, motion } from 'motion-v'
import { useScrollLock } from '@vueuse/core'
import { X } from 'lucide-vue-next'
import { springSheet } from '../motion/presets'
import { useSheetGesture } from '../composables/useSheetGesture'

const { t } = useI18n()

const props = defineProps<{
  open: boolean
  title: string
  description?: string
}>()

const emit = defineEmits<{ close: [] }>()

const titleId = useId()
const descriptionId = useId()
const { controls, panel, getPanelElement, startDrag, onDragEnd } = useSheetGesture({
  onDismiss: () => emit('close'),
})

function setPanel(element: Element | ComponentPublicInstance | null): void {
  panel.value = element && !(element instanceof Element) ? element : null
}

const scrollLocked = useScrollLock(document.body)
let previouslyFocused: HTMLElement | null = null

watch(
  () => props.open,
  async (open) => {
    scrollLocked.value = open

    if (open) {
      previouslyFocused =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
      await nextTick()
      const element = getPanelElement()
      const autoFocus = element?.querySelector<HTMLElement>('[data-autofocus]')
      ;(autoFocus ?? element)?.focus({ preventScroll: true })
      return
    }

    await nextTick()
    previouslyFocused?.focus({ preventScroll: true })
    previouslyFocused = null
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  scrollLocked.value = false
})
</script>

<template>
  <Teleport to="body">
    <AnimatePresence>
      <motion.div
        v-if="open"
        class="sheet-layer"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :exit="{ opacity: 0 }"
        :transition="{ duration: 0.18 }"
      >
        <div class="sheet-backdrop" @click="emit('close')" />
        <motion.div
          :ref="setPanel"
          class="sheet-panel"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="description ? descriptionId : undefined"
          tabindex="-1"
          :initial="{ y: '100%' }"
          :animate="{ y: 0 }"
          :exit="{ y: '100%' }"
          :transition="springSheet"
          :drag="'y'"
          :drag-controls="controls"
          :drag-constraints="{ top: 0, bottom: 0 }"
          :drag-elastic="0.25"
          :drag-snap-to-origin="true"
          @drag-end="onDragEnd"
        >
          <button
            class="sheet-handle"
            type="button"
            :aria-label="t('sheet.dragToClose')"
            @pointerdown="startDrag"
          >
            <span />
          </button>

          <div class="sheet-head">
            <h2 :id="titleId">{{ title }}</h2>
            <button class="icon-btn" type="button" :aria-label="t('app.close')" @click="emit('close')">
              <X :size="20" :stroke-width="1.75" aria-hidden="true" />
            </button>
          </div>

          <p v-if="description" :id="descriptionId" class="sheet-copy">
            {{ description }}
          </p>

          <div class="sheet-body">
            <slot />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  </Teleport>
</template>
