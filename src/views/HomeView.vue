<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import HeroCard from '../components/HeroCard.vue'
import QuickActions from '../components/QuickActions.vue'
import DebtList from '../components/DebtList.vue'
import { useDebtsStore } from '../stores/debts'
import { haptic } from '../utils/haptics'

const { t } = useI18n()

const debts = useDebtsStore()
const upcoming = computed(() => debts.upcoming.slice(0, 4))
const recent = computed(() => debts.debts.slice(0, 4))

function toggle(id: string): void {
  debts.togglePaid(id)
  haptic()
}
</script>

<template>
  <div class="page">
    <header class="page-head">
      <div>
        <span class="eyebrow">{{ t('home.eyebrow') }}</span>
        <h1>{{ t('home.title') }}</h1>
      </div>
    </header>

    <div class="home-layout">
      <div class="home-layout__primary">
        <HeroCard />
        <QuickActions />
      </div>

      <div class="home-layout__secondary">
        <section class="panel" aria-labelledby="upcoming-title">
          <div class="panel__head">
            <h2 id="upcoming-title" class="panel__title">{{ t('home.upcoming') }}</h2>
            <RouterLink class="panel__link" :to="{ name: 'insights' }">{{ t('home.schedule') }}</RouterLink>
          </div>
          <div class="panel__list">
            <DebtList
              :debts="upcoming"
              :label="t('home.upcomingLabel')"
              :empty="t('home.emptyUpcoming')"
              @toggle="toggle"
            />
          </div>
        </section>

        <section class="panel" aria-labelledby="recent-title">
          <div class="panel__head">
            <h2 id="recent-title" class="panel__title">{{ t('home.recent') }}</h2>
            <RouterLink class="panel__link" :to="{ name: 'debts' }">{{ t('home.viewAll') }}</RouterLink>
          </div>
          <div class="panel__list">
            <DebtList
              :debts="recent"
              :label="t('home.recentLabel')"
              :empty="t('home.emptyRecent')"
              @toggle="toggle"
            />
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
