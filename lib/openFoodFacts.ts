// Open Food Facts lookup — free, no API key, CORS-enabled, per-100g nutriments.
// Docs: https://openfoodfacts.github.io/openfoodfacts-server/api/

export interface OffProduct {
  name: string;
  kcal: number;
  p: number;
  f: number;
  c: number;
}

interface OffApiResponse {
  status: number;
  product?: {
    product_name?: string;
    product_name_ru?: string;
    generic_name?: string;
    nutriments?: {
      'energy-kcal_100g'?: number;
      proteins_100g?: number;
      fat_100g?: number;
      carbohydrates_100g?: number;
    };
  };
}

/**
 * Looks up a product by barcode (EAN-13/UPC-A) on Open Food Facts.
 * Returns null if not found or if the product is missing energy data.
 */
export async function fetchProductByBarcode(barcode: string): Promise<OffProduct | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=product_name,product_name_ru,generic_name,nutriments`,
      { headers: { 'User-Agent': 'CalorieTracker - Personal PWA' } },
    );
    if (!res.ok) return null;

    const data = (await res.json()) as OffApiResponse;
    if (data.status !== 1 || !data.product) return null;

    const n = data.product.nutriments ?? {};
    const kcal = n['energy-kcal_100g'];
    if (kcal === undefined) return null; // no usable nutrition data

    const name =
      data.product.product_name_ru ||
      data.product.product_name ||
      data.product.generic_name ||
      'Продукт без названия';

    return {
      name,
      kcal: Math.round(kcal),
      p: Math.round((n.proteins_100g ?? 0) * 10) / 10,
      f: Math.round((n.fat_100g ?? 0) * 10) / 10,
      c: Math.round((n.carbohydrates_100g ?? 0) * 10) / 10,
    };
  } catch (e) {
    console.error('[openFoodFacts] lookup failed', e);
    return null;
  }
}
