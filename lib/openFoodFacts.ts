// Open Food Facts lookup — free, no API key, CORS-enabled, per-100g nutriments.
// Docs: https://openfoodfacts.github.io/openfoodfacts-server/api/

export interface OffProduct {
  name: string;
  kcal: number;
  p: number;
  f: number;
  c: number;
  grams?: number; // package size, if determinable from product data
}

interface OffApiResponse {
  status: number;
  product?: {
    product_name?: string;
    product_name_ru?: string;
    generic_name?: string;
    quantity?: string;
    product_quantity?: number; // normalized grams, when OFF provides it
    nutriments?: {
      'energy-kcal_100g'?: number;
      proteins_100g?: number;
      fat_100g?: number;
      carbohydrates_100g?: number;
    };
  };
}

/** Parses free-text quantity ("500 g", "1 L", "12x25g") into an approximate gram value. */
function parseQuantityToGrams(quantity?: string): number | undefined {
  if (!quantity) return undefined;
  const m = quantity.match(/([\d.,]+)\s*(kg|g|l|ml)\b/i);
  if (!m) return undefined;
  const value = parseFloat(m[1].replace(',', '.'));
  if (isNaN(value) || value <= 0) return undefined;
  switch (m[2].toLowerCase()) {
    case 'kg': return Math.round(value * 1000);
    case 'g':  return Math.round(value);
    case 'l':  return Math.round(value * 1000); // approx 1L ≈ 1000g
    case 'ml': return Math.round(value);        // approx 1ml ≈ 1g
    default:   return undefined;
  }
}

/**
 * Looks up a product by barcode (EAN-13/UPC-A) on Open Food Facts.
 * Returns null if not found or if the product is missing energy data.
 */
export async function fetchProductByBarcode(barcode: string): Promise<OffProduct | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=product_name,product_name_ru,generic_name,nutriments,quantity,product_quantity`,
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

    const grams = data.product.product_quantity
      ? Math.round(data.product.product_quantity)
      : parseQuantityToGrams(data.product.quantity);

    return {
      name,
      kcal: Math.round(kcal),
      p: Math.round((n.proteins_100g ?? 0) * 10) / 10,
      f: Math.round((n.fat_100g ?? 0) * 10) / 10,
      c: Math.round((n.carbohydrates_100g ?? 0) * 10) / 10,
      ...(grams ? { grams } : {}),
    };
  } catch (e) {
    console.error('[openFoodFacts] lookup failed', e);
    return null;
  }
}
