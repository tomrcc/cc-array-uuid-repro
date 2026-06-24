import editableRegions from "@cloudcannon/editable-regions/astro-integration";
import { defineConfig } from "astro/config";

// Minimal CloudCannon visual-editing setup — the editable-regions integration
// injects the client that hydrates [data-editable] regions in the Visual Editor.
// Sourcemaps inline + no minify just makes the editor DOM easier to inspect.
export default defineConfig({
  integrations: [editableRegions()],
  vite: {
    build: { sourcemap: "inline", minify: false },
  },
});
