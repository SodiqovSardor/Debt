<script setup lang="ts">
import { motion } from 'motion-v'
import DebtRow from './DebtRow.vue'
import { listItem } from '../motion/presets'
import type { Debt } from '../types/debt'

withDefaults(
  defineProps<{
    debts: Debt[]
    label?: string
    empty?: string
  }>(),
  { label: 'Debts', empty: 'No debts here yet.' },
)

const emit = defineEmits<{ toggle: [id: string] }>()
</script>

<template>
  <div>
    <motion.ul v-if="debts.length" class="debt-list" :aria-label="label">
      <motion.li
        v-for="(debt, index) in debts"
        :key="debt.id"
        class="debt-list__item"
        v-bind="listItem(index)"
      >
        <DebtRow :debt="debt" @toggle="emit('toggle', $event)" />
      </motion.li>
    </motion.ul>
    <p v-else class="empty-state">{{ empty }}</p>
  </div>
</template>
