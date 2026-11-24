import { ref, type ComponentPublicInstance } from 'vue'
import { useDragControls, type PanInfo } from 'motion-v'

interface SheetGestureOptions {
  onDismiss: () => void
  /** Fraction of the sheet's height that must be crossed to dismiss. */
  threshold?: number
}

/**
 * Drag controls for a bottom sheet. Only the handle starts a drag, which keeps
 * the sheet body scrollable. Motion snaps the panel back unless the threshold
 * is crossed.
 */
export function useSheetGesture(options: SheetGestureOptions) {
  const controls = useDragControls()
  const panel = ref<ComponentPublicInstance | null>(null)

  function getPanelElement(): HTMLElement | null {
    const element = panel.value?.$el
    return element instanceof HTMLElement ? element : null
  }

  function startDrag(event: PointerEvent): void {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    controls.start(event)
  }

  function onDragEnd(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo): void {
    const height = getPanelElement()?.offsetHeight ?? 0
    if (height > 0 && info.offset.y > height * (options.threshold ?? 0.4)) {
      options.onDismiss()
    }
  }

  return { controls, panel, getPanelElement, startDrag, onDragEnd }
}
