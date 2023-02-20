import { GwfVisPlugin } from "./plugin";

export type GwfVisPluginModule = {
  default: { new (): GwfVisPlugin };
};

export const pluginNameAndTagNameMap = new Map<string, string>();

export default async function importPlugin(name: string, url: string) {
  const pluginModule = (await import(
    /* @vite-ignore */ url
  )) as GwfVisPluginModule;
  const plugin = pluginModule?.default;
  const uniqueId = pluginNameAndTagNameMap.size;
  const tagName = `gwf-vis-plugin-${convertToDashCase(name)}-${uniqueId}`;
  if (definePlugin(tagName, plugin)) {
    pluginNameAndTagNameMap.set(name, tagName);
  }
}

function convertToDashCase(text: string = "") {
  const words = text.split(/-|\W|_/);
  return words.filter(Boolean).join("-").toLowerCase();
}

function definePlugin(tagName: string, plugin: CustomElementConstructor) {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, plugin);
    if (customElements.get(tagName)) {
      return true;
    }
  }
  throw new Error("Fail to register the plugin.");
}
