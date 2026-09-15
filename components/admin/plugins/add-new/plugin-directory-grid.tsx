import { PluginManifest } from "@/lib/plugins/types";
import { PluginCard } from "./plugin-card";

export function PluginDirectoryGrid({ plugins }: { plugins: PluginManifest[] }) {
  if (!plugins.length) {
    return (
      <div className="rounded border border-[#c3c4c7] bg-white p-8 text-center text-[13px] text-[#646970]">
        No plugins found in the directory matching your search.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {plugins.map((plugin) => (
        <PluginCard key={plugin.slug} plugin={plugin} />
      ))}
    </div>
  );
}
