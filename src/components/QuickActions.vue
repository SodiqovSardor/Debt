<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CalendarClock, HandCoins, Plus } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useUiStore } from '../stores/ui'

const { t } = useI18n()

const router = useRouter()
const ui = useUiStore()

function openSchedule(): void {
  void router.push({ name: 'insights' })
}
</script>

<template>
  <div class="quick-actions">
    <button class="quick-action quick-action--primary" type="button" @click="ui.openAdd()">
      <span class="quick-action__circle">
        <Plus :size="22" :stroke-width="1.75" aria-hidden="true" />
      </span>
      {{ t('home.quickAdd') }}
    </button>

    <button class="quick-action" type="button" @click="ui.openRepay()">
      <span class="quick-action__circle">
        <HandCoins :size="21" :stroke-width="1.75" aria-hidden="true" />
      </span>
      {{ t('home.quickRepay') }}
    </button>

    <button class="quick-action" type="button" @click="openSchedule">
      <span class="quick-action__circle">
        <CalendarClock :size="21" :stroke-width="1.75" aria-hidden="true" />
      </span>
      {{ t('home.quickSchedule') }}
    </button>
  </div>
</template>
