import type { SiteContent, Variant, VariantKind } from "../types";
import { MAX_GALLERY_IMAGES, MAX_TOTAL_IMAGE_CHARS, type SlotRef } from "./limits";

export interface SiteState {
  variants: Variant[];
  content: SiteContent;
}

export interface SlotResult extends SiteState {
  /** Something worth telling the user, such as pictures that did not fit. */
  notice?: string;
}

type ItemList = "features" | "projects" | "menu" | "posts";
const ITEM_LISTS: readonly string[] = ["features", "projects", "menu", "posts"];

/** Total size of every picture in a website, in characters. */
export function imageChars(variant: Variant, content: SiteContent): number {
  const cards = [content.features, content.projects, content.menu, content.posts].flat();
  return (
    (variant.photo?.length ?? 0) +
    (content.aboutImage?.length ?? 0) +
    content.gallery.reduce((sum, picture) => sum + picture.length, 0) +
    cards.reduce((sum, item) => sum + (item.image?.length ?? 0), 0)
  );
}

/** Copy of the content without any pictures, for thumbnails and the JSON spec. */
export function withoutPictures(content: SiteContent): SiteContent {
  const strip = (list: SiteContent["features"]) => list.map(({ image: _image, ...rest }) => (void _image, rest));
  return {
    ...content,
    features: strip(content.features),
    projects: strip(content.projects),
    menu: strip(content.menu),
    posts: strip(content.posts),
    aboutImage: undefined,
    gallery: [],
  };
}

function updateItem(list: SiteContent["features"], index: number, image: string | undefined) {
  if (index >= list.length) return list;
  return list.map((item, i) => {
    if (i !== index) return item;
    const { image: _old, ...rest } = item;
    void _old;
    return image ? { ...rest, image } : rest;
  });
}

function updateVariant(variants: Variant[], id: VariantKind, patch: Partial<Variant>): Variant[] {
  return variants.map((v) => (v.id === id ? { ...v, ...patch } : v));
}

/** Puts one or more pictures into a slot. Returns the state unchanged when the slot cannot take them. */
export function setSlotImages(
  state: SiteState,
  selectedId: VariantKind,
  slot: SlotRef,
  urls: string[],
): SlotResult {
  if (urls.length === 0) return state;
  const [first] = urls;
  const { content } = state;
  let next: SlotResult = state;

  if (slot.kind === "hero") {
    next = { ...state, variants: updateVariant(state.variants, selectedId, { photo: first, imageMode: "photo" }) };
  } else if (slot.kind === "about") {
    next = { ...state, content: { ...content, aboutImage: first } };
  } else if (slot.kind === "gallery") {
    if (slot.index === null) {
      const room = MAX_GALLERY_IMAGES - content.gallery.length;
      const added = urls.slice(0, Math.max(0, room));
      const notice =
        added.length < urls.length ? `The gallery holds up to ${MAX_GALLERY_IMAGES} pictures, so some were not added.` : undefined;
      next = { ...state, content: { ...content, gallery: [...content.gallery, ...added] }, notice };
    } else if (slot.index < content.gallery.length) {
      const gallery = content.gallery.map((picture, i) => (i === slot.index ? first : picture));
      next = { ...state, content: { ...content, gallery } };
    }
  } else if (ITEM_LISTS.includes(slot.kind) && slot.index !== null) {
    const key = slot.kind as ItemList;
    next = { ...state, content: { ...content, [key]: updateItem(content[key], slot.index, first) } };
  }

  const selected = next.variants.find((v) => v.id === selectedId);
  if (selected && imageChars(selected, next.content) > MAX_TOTAL_IMAGE_CHARS) {
    return { ...state, notice: "That would make the website too large. Remove a picture or use a smaller one." };
  }
  return next;
}

export function removeSlotImage(state: SiteState, selectedId: VariantKind, slot: SlotRef): SiteState {
  const { content } = state;
  if (slot.kind === "hero") {
    return { ...state, variants: updateVariant(state.variants, selectedId, { photo: undefined, imageMode: "scene" }) };
  }
  if (slot.kind === "about") return { ...state, content: { ...content, aboutImage: undefined } };
  if (slot.kind === "gallery") {
    if (slot.index === null) return state;
    return { ...state, content: { ...content, gallery: content.gallery.filter((_, i) => i !== slot.index) } };
  }
  if (ITEM_LISTS.includes(slot.kind) && slot.index !== null) {
    const key = slot.kind as ItemList;
    return { ...state, content: { ...content, [key]: updateItem(content[key], slot.index, undefined) } };
  }
  return state;
}
