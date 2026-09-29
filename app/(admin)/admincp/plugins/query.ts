import {
  getAllPlugins as getPluginsFromService,
  getPluginCounts as getCountsFromService,
  getCatalogPlugins as getCatalogFromService,
} from "@/services/plugin.service";
import type { PluginManifest } from "@/lib/plugins/types";

export type PluginItem = PluginManifest;

export async function getPlugins(options: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
} = {}) {
  return getPluginsFromService(options);
}

export async function getPluginCounts() {
  return getCountsFromService();
}

export async function getCatalogPlugins(options: {
  category?: string;
  search?: string;
} = {}) {
  return getCatalogFromService(options);
}
