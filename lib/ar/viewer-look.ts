// How every 3D dish is lit on screen (model-viewer).
// Scanned food already has the real light of the photos baked into its texture,
// so it's exported unlit (scripts/import-model.mjs --unlit) and shown with
// neutral tone mapping: the colors stay exactly as photographed. Neutral
// lighting still gives modeled dishes and plates soft, natural highlights.
export const VIEWER_LOOK = {
  "environment-image": "neutral",
  "tone-mapping": "neutral",
  "shadow-softness": "1",
} as const;
