import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', () => {
  const addOpen = ref(false)
  const editId = ref<string | null>(null)
  const repayOpen = ref(false)
  const deleteId = ref<string | null>(null)
  const searchFocusTick = ref(0)

  const anySheetOpen = computed(
    () =>
      addOpen.value ||
      editId.value !== null ||
      repayOpen.value ||
      deleteId.value !== null,
  )

  function closeAll(): void {
    addOpen.value = false
    editId.value = null
    repayOpen.value = false
    deleteId.value = null
  }

  function openAdd(): void {
    closeAll()
    addOpen.value = true
  }

  function closeAdd(): void {
    addOpen.value = false
  }

  function openEdit(id: string): void {
    closeAll()
    editId.value = id
  }

  function closeEdit(): void {
    editId.value = null
  }

  function openRepay(): void {
    closeAll()
    repayOpen.value = true
  }

  function closeRepay(): void {
    repayOpen.value = false
  }

  function requestDelete(id: string): void {
    closeAll()
    deleteId.value = id
  }

  function clearDelete(): void {
    deleteId.value = null
  }

  function requestSearchFocus(): void {
    searchFocusTick.value += 1
  }

  return {
    addOpen,
    editId,
    repayOpen,
    deleteId,
    searchFocusTick,
    anySheetOpen,
    closeAll,
    openAdd,
    closeAdd,
    openEdit,
    closeEdit,
    openRepay,
    closeRepay,
    requestDelete,
    clearDelete,
    requestSearchFocus,
  }
})
