import { ActionCallback, FilterCallback, HookItem } from "./types";

const filters = new Map<string, HookItem<FilterCallback>[]>();
const actions = new Map<string, HookItem<ActionCallback>[]>();

/**
 * Register a filter hook
 * @param tag Hook name (e.g. 'the_content')
 * @param callback Function to transform value
 * @param priority Lower numbers execute earlier (default 10)
 */
export function addFilter<T = any>(
  tag: string,
  callback: FilterCallback<T>,
  priority = 10
): void {
  if (!filters.has(tag)) {
    filters.set(tag, []);
  }
  const list = filters.get(tag)!;
  list.push({ callback, priority });
  list.sort((a, b) => a.priority - b.priority);
}

/**
 * Apply all registered filters to a value
 */
export async function applyFilters<T = any>(
  tag: string,
  value: T,
  context?: any
): Promise<T> {
  const list = filters.get(tag);
  if (!list || list.length === 0) {
    return value;
  }

  let result = value;
  for (const hook of list) {
    try {
      result = await hook.callback(result, context);
    } catch (error) {
      console.error(`[Plugin Hook] Error in filter '${tag}':`, error);
    }
  }
  return result;
}

/**
 * Register an action hook
 */
export function addAction(
  tag: string,
  callback: ActionCallback,
  priority = 10
): void {
  if (!actions.has(tag)) {
    actions.set(tag, []);
  }
  const list = actions.get(tag)!;
  list.push({ callback, priority });
  list.sort((a, b) => a.priority - b.priority);
}

/**
 * Trigger all registered actions for a tag
 */
export async function doAction(tag: string, context?: any): Promise<void> {
  const list = actions.get(tag);
  if (!list || list.length === 0) {
    return;
  }

  for (const hook of list) {
    try {
      await hook.callback(context);
    } catch (error) {
      console.error(`[Plugin Hook] Error in action '${tag}':`, error);
    }
  }
}

/**
 * Reset hooks (useful for hot reloads and testing)
 */
export function clearAllHooks(): void {
  filters.clear();
  actions.clear();
}
