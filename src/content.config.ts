import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

// A tiny "pages" collection. Each entry's frontmatter holds an `items` array;
// each item has a CloudCannon-managed `_uuid` and a `label`.
export const collections = {
  pages: defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/pages" }),
    schema: z.object({
      title: z.string().optional(),
      items: z
        .array(
          z.object({
            _uuid: z.string().optional(),
            label: z.string().optional(),
          }),
        )
        .default([]),
    }),
  }),
};
