/** Maps a saved Field identity to a stable cosmetic crop variant without consuming gameplay randomness. */
export function getFieldCropVariantIndex(stableKey: string, variantCount: number): number {
  if (!Number.isSafeInteger(variantCount) || variantCount < 1) throw new Error("field_crop_variant_count_invalid");
  let hash = 0x811c9dc5;
  for (let index = 0; index < stableKey.length; index++) {
    hash = Math.imul(hash ^ stableKey.charCodeAt(index), 0x01000193);
  }
  return (hash >>> 0) % variantCount;
}
