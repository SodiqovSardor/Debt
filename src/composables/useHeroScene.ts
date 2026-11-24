import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'
import { usePreferredReducedMotion } from '@vueuse/core'

function shouldSkipThree(): boolean {
  const cores = navigator.hardwareConcurrency
  if (typeof cores === 'number' && cores <= 4) return true

  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  if (typeof memory === 'number' && memory <= 4) return true

  return false
}

/**
 * One lazy Three.js scene for the Home hero. It is created after first paint,
 * pauses when off-screen or hidden, and disposes every GPU resource on unmount.
 */
export function useHeroScene(host: Ref<HTMLElement | null>, canvas: Ref<HTMLCanvasElement | null>) {
  const reducedMotion = usePreferredReducedMotion()
  const ready = ref(false)

  let disposed = false
  let renderer: import('three').WebGLRenderer | null = null
  let scene: import('three').Scene | null = null
  let camera: import('three').PerspectiveCamera | null = null
  let mesh: import('three').Mesh | null = null
  let geometry: import('three').IcosahedronGeometry | null = null
  let material: import('three').MeshStandardMaterial | null = null

  let resizeObserver: ResizeObserver | null = null
  let intersectionObserver: IntersectionObserver | null = null
  let scheduled: number | null = null
  let animationFrame: number | null = null
  let running = false
  let visible = true
  let startedAt = 0

  function schedule(callback: () => void): number {
    const idleWindow = window as Window & {
      requestIdleCallback?: (handler: () => void, options?: { timeout: number }) => number
      cancelIdleCallback?: (handle: number) => void
    }
    if (typeof idleWindow.requestIdleCallback === 'function') {
      return idleWindow.requestIdleCallback(callback, { timeout: 1_000 })
    }
    return window.setTimeout(callback, 220)
  }

  function cancelScheduled(id: number): void {
    const idleWindow = window as Window & {
      cancelIdleCallback?: (handle: number) => void
    }
    if (typeof idleWindow.cancelIdleCallback === 'function') idleWindow.cancelIdleCallback(id)
    else window.clearTimeout(id)
  }

  function resize(): void {
    if (!renderer || !camera || !host.value) return
    const rect = host.value.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    renderer.setSize(rect.width, rect.height, false)
    camera.aspect = rect.width / rect.height
    camera.updateProjectionMatrix()
  }

  function shouldRender(): boolean {
    return visible && !document.hidden && !disposed
  }

  function frame(): void {
    if (!running) return
    if (!shouldRender() || !renderer || !scene || !camera || !mesh) {
      running = false
      return
    }

    const elapsed = (performance.now() - startedAt) / 1_000
    mesh.rotation.y = elapsed * 0.18
    mesh.rotation.x = 0.32 + Math.sin(elapsed * 0.25) * 0.08
    renderer.render(scene, camera)
    animationFrame = window.requestAnimationFrame(frame)
  }

  function startLoop(): void {
    if (running || !shouldRender() || !renderer) return
    running = true
    animationFrame = window.requestAnimationFrame(frame)
  }

  function stopLoop(): void {
    running = false
    if (animationFrame !== null) {
      window.cancelAnimationFrame(animationFrame)
      animationFrame = null
    }
  }

  function syncLoop(): void {
    if (shouldRender()) startLoop()
    else stopLoop()
  }

  function onVisibilityChange(): void {
    syncLoop()
  }

  async function init(): Promise<void> {
    if (disposed || reducedMotion.value === 'reduce' || !canvas.value || !host.value) return

    const THREE = await import('three')
    if (disposed || !canvas.value || !host.value) return
    renderer = new THREE.WebGLRenderer({
      canvas: canvas.value,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setClearColor(0x000000, 0)

    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
    camera.position.set(0, 0, 6)

    geometry = new THREE.IcosahedronGeometry(1.55, 1)
    material = new THREE.MeshStandardMaterial({
      color: 0xd4826a,
      roughness: 0.34,
      metalness: 0.12,
      transparent: true,
      opacity: 0.36,
      flatShading: true,
    })
    mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(1.55, -0.45, 0)
    mesh.rotation.set(0.32, 0.4, 0)
    scene.add(mesh)

    scene.add(new THREE.AmbientLight(0xf2ece2, 0.9))
    const light = new THREE.DirectionalLight(0xffd9c8, 2.1)
    light.position.set(3, 4, 5)
    scene.add(light)

    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(host.value)

    intersectionObserver = new IntersectionObserver(
      (entries) => {
        visible = entries.some((entry) => entry.isIntersecting)
        syncLoop()
      },
      { threshold: 0.05 },
    )
    intersectionObserver.observe(host.value)

    document.addEventListener('visibilitychange', onVisibilityChange)

    resize()
    startedAt = performance.now()
    if (renderer && scene && camera) {
      renderer.render(scene, camera)
      ready.value = true
      startLoop()
    }
  }

  onMounted(() => {
    if (reducedMotion.value === 'reduce' || shouldSkipThree()) return
    scheduled = schedule(() => {
      scheduled = null
      void init().catch(() => {
        // No WebGL, a lost context, or a blocked module: keep the CSS gradient.
      })
    })
  })

  onBeforeUnmount(() => {
    disposed = true
    if (scheduled !== null) cancelScheduled(scheduled)
    stopLoop()
    resizeObserver?.disconnect()
    intersectionObserver?.disconnect()
    document.removeEventListener('visibilitychange', onVisibilityChange)
    geometry?.dispose()
    material?.dispose()
    renderer?.dispose()
    renderer?.forceContextLoss()
    scene?.clear()
    renderer = null
    scene = null
    camera = null
    mesh = null
    geometry = null
    material = null
  })

  return { ready }
}
