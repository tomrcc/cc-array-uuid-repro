import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

// "pages" collection. Each entry holds a `content_blocks` page-builder array;
// the only block type is `item-list`, which itself holds an `items` array.
const item = z.object({
  _uuid: z.string().optional(),
  label: z.string().optional(),
});

export const collections = {
  pages: defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/pages" }),
    schema: z.object({
      title: z.string().optional(),
      content_blocks: z
        .array(
          z.object({
            _name: z.string(),
            items: z.array(item).default([]),
          }),
        )
        .default([]),
    }),
  }),
};
