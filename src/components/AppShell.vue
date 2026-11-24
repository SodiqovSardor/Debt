<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEventListener } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import TabBar from './TabBar.vue'
import AddDebtSheet from './AddDebtSheet.vue'
import EditDebtSheet from './EditDebtSheet.vue'
import RepaySheet from './RepaySheet.vue'
import ConfirmSheet from './ConfirmSheet.vue'
import SkeletonView from './SkeletonView.vue'
import { useDebtsStore } from '../stores/debts'
import { useUiStore } from '../stores/ui'
import { formatUZS } from '../utils/format'

const { t } = useI18n()

const route = useRoute()
const router = useRouter()
const debts = useDebtsStore()
const ui = useUiStore()

const transitionName = ref('fade')
let previousDepth = route.meta.detail ? 1 : 0

watch(
  () => route.path,
  () => {
    const depth = route.meta.detail ? 1 : 0
    transitionName.value =
      depth > previousDepth ? 'slide-forward' : depth < previousDepth ? 'slide-back' : 'fade'
    previousDepth = depth
  },
)

const deleteDebt = computed(
  () => (ui.deleteId ? debts.items.find((debt) => debt.id === ui.deleteId) ?? null : null),
)

const deleteTitle = computed(() =>
  deleteDebt.value ? t('detail.deleteTitle', { person: deleteDebt.value.person }) : t('detail.delete'),
)

const deleteMessage = computed(() =>
  deleteDebt.value
    ? t('detail.deleteMessage', { amount: formatUZS(deleteDebt.value.amount) })
    : '',
)

function confirmDelete(): void {
  const target = deleteDebt.value
  if (!target) return

  debts.removeDebt(target.id)
  ui.clearDelete()

  if (route.name === 'debt-detail' && route.params.id === target.id) {
    void router.replace({ name: 'debts' })
  }
}

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  )
}

useEventListener(window, 'keydown', (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    if (ui.anySheetOpen) {
      event.preventDefault()
      ui.closeAll()
    }
    return
  }

  if (
    isTypingTarget(event.target) ||
    event.metaKey ||
    event.ctrlKey ||
    event.altKey ||
    ui.anySheetOpen
  ) {
    return
  }

  if (event.key.toLowerCase() === 'n') {
    event.preventDefault()
    ui.openAdd()
    return
  }

  if (event.key === '/') {
    event.preventDefault()
    if (route.name === 'debts') {
      ui.requestSearchFocus()
      return
    }
    void router.push({ name: 'debts' }).then(async () => {
      await nextTick()
      ui.requestSearchFocus()
    })
  }
})
</script>

<template>
  <div class="shell" :class="{ 'shell--detail': route.meta.detail }">
    <a class="skip-link" href="#main">{{ t('app.skipToContent') }}</a>

    <TabBar />

    <main id="main" class="shell__main" tabindex="-1">
      <RouterView v-slot="{ Component, route: current }">
        <Transition :name="transitionName">
          <Suspense :key="current.path">
            <component :is="Component" />
            <template #fallback>
              <SkeletonView />
            </template>
          </Suspense>
        </Transition>
      </RouterView>
    </main>

    <AddDebtSheet :open="ui.addOpen" @close="ui.closeAdd" />
    <EditDebtSheet :open="ui.editId !== null" :debt-id="ui.editId" @close="ui.closeEdit" />
    <RepaySheet :open="ui.repayOpen" @close="ui.closeRepay" />
    <ConfirmSheet
      :open="deleteDebt !== null"
      :title="deleteTitle"
      :message="deleteMessage"
      :confirm-label="t('app.delete')"
      @close="ui.clearDelete"
      @confirm="confirmDelete"
    />
  </div>
</template>
