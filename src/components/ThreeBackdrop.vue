<script setup lang="ts">
import { ref } from 'vue'
import { useHeroScene } from '../composables/useHeroScene'

const host = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const { ready } = useHeroScene(host, canvas)
</script>

<template>
  <div ref="host" class="hero-backdrop" aria-hidden="true">
    <div class="hero-backdrop__gradient" />
    <canvas ref="canvas" class="hero-backdrop__canvas" :class="{ 'is-ready': ready }" />
  </div>
</template>
