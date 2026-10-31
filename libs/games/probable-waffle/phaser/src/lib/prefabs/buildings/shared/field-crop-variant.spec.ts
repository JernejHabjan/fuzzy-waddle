import { getFieldCropVariantIndex } from "./field-crop-variant";

describe("field crop variants", () => {
  it("selects a varied but stable cosmetic variant from saved field identity", () => {
    expect(getFieldCropVariantIndex("field-a", 5)).toBe(0);
    expect(getFieldCropVariantIndex("field-b", 5)).toBe(3);
    expect(getFieldCropVariantIndex("field-c", 5)).toBe(2);
    expect(getFieldCropVariantIndex("field-a", 5)).toBe(getFieldCropVariantIndex("field-a", 5));
  });

  it("rejects an empty variant set", () => {
    expect(() => getFieldCropVariantIndex("field-a", 0)).toThrow("field_crop_variant_count_invalid");
  });
});
