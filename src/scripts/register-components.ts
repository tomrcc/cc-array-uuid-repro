/// <reference types="astro/client" />
import { registerAstroComponent } from "@cloudcannon/editable-regions/astro";
import ItemList from "../components/ItemList.astro";

// Registering the component is what lets CloudCannon RE-RENDER it from data in
// the Visual Editor. The component key must match the `data-component` value
// used on the page (and the block's `_name`).
registerAstroComponent("item-list", ItemList);
