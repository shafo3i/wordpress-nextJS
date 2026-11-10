import { AVAILABLE_PLUGINS } from "@/plugins/registry"
import { createPluginRuntime } from "./hooks"
import { getActivePluginSlugs } from "@/services/plugin.service"
export {
  getActivePluginSlugs,
  getInstalledPluginSlugs,
} from "@/services/plugin.service"

export async function initActivePlugins() {
  const activeSlugs = await getActivePluginSlugs()
  return createPluginRuntime(async () => {
    for (const slug of activeSlugs) {
      const plugin = AVAILABLE_PLUGINS[slug]
      if (!plugin) continue
      try {
        await plugin.init()
      } catch {
        console.error(`[Plugins] Failed to initialize '${slug}'`)
      }
    }
  })
}
