import { createRouter, createWebHistory } from 'vue-router'
import type { TabId } from '../types/debt'
import { installGuards } from './guards'

declare module 'vue-router' {
  interface RouteMeta {
    titleKey?: string
    tab?: TabId
    detail?: boolean
  }
}

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/signup',
      name: 'signup',
      component: () => import('../views/SignupView.vue'),
      meta: { titleKey: 'auth.signupTitle' },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { titleKey: 'auth.loginTitle' },
    },
    {
      path: '/setup-pin',
      name: 'setup-pin',
      component: () => import('../views/SetupPinView.vue'),
      meta: { titleKey: 'pin.setupTitle' },
    },
    {
      path: '/lock',
      name: 'lock',
      component: () => import('../views/LockView.vue'),
      meta: { titleKey: 'app.lockedTitle' },
    },
    {
      path: '/',
      component: () => import('../components/AppShell.vue'),
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('../views/HomeView.vue'),
          meta: { titleKey: 'app.nav.home', tab: 'home' },
        },
        {
          path: 'debts',
          name: 'debts',
          component: () => import('../views/DebtsView.vue'),
          meta: { titleKey: 'app.nav.debts', tab: 'debts' },
        },
        {
          path: 'insights',
          name: 'insights',
          component: () => import('../views/InsightsView.vue'),
          meta: { titleKey: 'app.nav.insights', tab: 'insights' },
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('../views/ProfileView.vue'),
          meta: { titleKey: 'app.nav.profile', tab: 'profile' },
        },
        {
          path: 'debts/:id',
          name: 'debt-detail',
          component: () => import('../views/DebtDetailView.vue'),
          meta: { titleKey: 'detail.title', tab: 'debts', detail: true },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
  scrollBehavior: (_to, _from, savedPosition) => savedPosition ?? { top: 0 },
})

installGuards(router)
