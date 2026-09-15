export type PluginManifest = {
  slug: string;
  name: string;
  description: string;
  version: string;
  author: string;
  authorUrl?: string;
  pluginUrl?: string;
  isActive?: boolean;
  isInstalled?: boolean;
  settingsUrl?: string;
  rating?: number;
  reviewsCount?: number;
  activeInstalls?: string;
  icon?: string;
  category?: "Featured" | "Popular" | "Recommended";
};

export type FilterCallback<T = any> = (value: T, context?: any) => T | Promise<T>;
export type ActionCallback = (context?: any) => void | Promise<void>;

export type HookItem<T = any> = {
  callback: T;
  priority: number;
};

export type PluginModule = {
  manifest: PluginManifest;
  init: () => void | Promise<void>;
};
