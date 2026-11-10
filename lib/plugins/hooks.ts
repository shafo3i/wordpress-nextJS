import { AsyncLocalStorage } from "node:async_hooks"
import {
  ActionCallback,
  FilterCallback,
  HookItem,
  PluginContext,
} from "./types"

type Hooks = {
  filters: Map<string, HookItem<FilterCallback>[]>
  actions: Map<string, HookItem<ActionCallback>[]>
}
const storage = new AsyncLocalStorage<Hooks>()
const emptyHooks = (): Hooks => ({ filters: new Map(), actions: new Map() })
const fallback = emptyHooks()
const current = () => storage.getStore() || fallback
export async function createPluginRuntime(initialize: () => Promise<void>) {
  const hooks = emptyHooks()
  await storage.run(hooks, initialize)
  return {
    applyFilters: <T>(tag: string, value: T, context?: PluginContext) =>
      storage.run(hooks, () => applyFilters(tag, value, context)),
    doAction: (tag: string, context?: PluginContext) =>
      storage.run(hooks, () => doAction(tag, context)),
  }
}

/**
 * Register a filter hook
 * @param tag Hook name (e.g. 'the_content')
 * @param callback Function to transform value
 * @param priority Lower numbers execute earlier (default 10)
 */
export function addFilter<T = unknown>(
  tag: string,
  callback: FilterCallback<T>,
  priority = 10
): void {
  const { filters } = current()
  if (!filters.has(tag)) {
    filters.set(tag, [])
  }
  const list = filters.get(tag)!
  list.push({
    callback: (value, context) => callback(value as T, context),
    priority,
  })
  list.sort((a, b) => a.priority - b.priority)
}

/**
 * Apply all registered filters to a value
 */
export async function applyFilters<T = unknown>(
  tag: string,
  value: T,
  context?: PluginContext
): Promise<T> {
  const { filters } = current()
  const list = filters.get(tag)
  if (!list || list.length === 0) {
    return value
  }

  let result = value
  for (const hook of list) {
    try {
      result = (await hook.callback(result, context)) as T
    } catch (error) {
      console.error(`[Plugin Hook] Error in filter '${tag}':`, error)
    }
  }
  return result
}

/**
 * Register an action hook
 */
export function addAction(
  tag: string,
  callback: ActionCallback,
  priority = 10
): void {
  const { actions } = current()
  if (!actions.has(tag)) {
    actions.set(tag, [])
  }
  const list = actions.get(tag)!
  list.push({ callback, priority })
  list.sort((a, b) => a.priority - b.priority)
}

/**
 * Trigger all registered actions for a tag
 */
export async function doAction(
  tag: string,
  context?: PluginContext
): Promise<void> {
  const { actions } = current()
  const list = actions.get(tag)
  if (!list || list.length === 0) {
    return
  }

  for (const hook of list) {
    try {
      await hook.callback(context)
    } catch (error) {
      console.error(`[Plugin Hook] Error in action '${tag}':`, error)
    }
  }
}

/**
 * Reset hooks (useful for hot reloads and testing)
 */
export function clearAllHooks(): void {
  const { filters, actions } = current()
  filters.clear()
  actions.clear()
}
