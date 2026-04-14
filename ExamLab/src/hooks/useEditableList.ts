import { useCallback } from 'react'

interface UseEditableListOptions<T> {
  /** Minimale Anzahl Items (verhindert Entfernen) */
  minItems?: number
  /** Factory für neue Items */
  createDefault: () => T
}

interface UseEditableListResult<T> {
  updateItem: (index: number, partial: Partial<T>) => void
  addItem: () => void
  removeItem: (index: number) => void
  canRemove: boolean
}

/**
 * Generischer Hook für CRUD-Operationen auf Array-State.
 * Reduziert den wiederholten Code in Fragen-Editoren (MC, R/F, Lückentext, etc.)
 */
export function useEditableList<T>(
  items: T[],
  setItems: (items: T[]) => void,
  options: UseEditableListOptions<T>,
): UseEditableListResult<T> {
  const { minItems = 0, createDefault } = options

  const updateItem = useCallback((index: number, partial: Partial<T>) => {
    setItems(items.map((item, i) => i === index ? { ...item, ...partial } : item))
  }, [items, setItems])

  const addItem = useCallback(() => {
    setItems([...items, createDefault()])
  }, [items, setItems, createDefault])

  const removeItem = useCallback((index: number) => {
    if (items.length <= minItems) return
    setItems(items.filter((_, i) => i !== index))
  }, [items, setItems, minItems])

  return {
    updateItem,
    addItem,
    removeItem,
    canRemove: items.length > minItems,
  }
}
