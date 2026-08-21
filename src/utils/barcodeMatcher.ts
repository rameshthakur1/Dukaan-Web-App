import { Product } from '../types';

/**
 * Normalizes barcode or SKU string for comparison
 * Removes whitespace, dashes, underscores, and lowercase
 */
export function normalizeBarcodeString(code: string | undefined | null): string {
  if (!code) return '';
  return code.toString().trim().toLowerCase().replace(/[\s\-_]/g, '');
}

/**
 * Checks if two barcode/SKU strings match across multiple standard barcode formats
 * (EAN-13, UPC-A, Code 128, SKU prefixes, leading zeros)
 */
export function isBarcodeMatch(targetCode: string | undefined | null, scannedCode: string | undefined | null): boolean {
  if (!targetCode || !scannedCode) return false;

  const cleanTarget = normalizeBarcodeString(targetCode);
  const cleanScanned = normalizeBarcodeString(scannedCode);

  if (!cleanTarget || !cleanScanned) return false;

  // 1. Direct exact match (e.g. "9556775008037" === "9556775008037")
  if (cleanTarget === cleanScanned) return true;

  // 2. Remove standard prefixes like "sku-", "barcode-", "bar-", "item-", "code-"
  const noPrefixTarget = cleanTarget.replace(/^(sku|barcode|bar|code|item|prod|id)/i, '');
  const noPrefixScanned = cleanScanned.replace(/^(sku|barcode|bar|code|item|prod|id)/i, '');

  if (
    noPrefixTarget === cleanScanned ||
    cleanTarget === noPrefixScanned ||
    (noPrefixTarget && noPrefixTarget === noPrefixScanned)
  ) {
    return true;
  }

  // 3. Digits-only normalization (for numeric barcodes like EAN, UPC, ISBN, ITF)
  const digitsTarget = cleanTarget.replace(/\D/g, '');
  const digitsScanned = cleanScanned.replace(/\D/g, '');

  if (digitsTarget && digitsScanned) {
    // Exact digits match
    if (digitsTarget === digitsScanned) return true;

    // Leading zeros normalization (e.g. "09556775008037" vs "9556775008037")
    const normTarget = digitsTarget.replace(/^0+/, '');
    const normScanned = digitsScanned.replace(/^0+/, '');
    if (normTarget && normScanned && normTarget === normScanned) return true;

    // UPC-A (12-digit) padded to EAN-13 (13-digit) with leading 0
    if (digitsTarget.length === 12 && digitsScanned.length === 13 && digitsScanned === '0' + digitsTarget) return true;
    if (digitsScanned.length === 12 && digitsTarget.length === 13 && digitsTarget === '0' + digitsScanned) return true;

    // End-of-string match if one is a full SKU containing the exact numeric barcode
    if (digitsTarget.length >= 6 && digitsScanned.length >= 6) {
      if (digitsTarget.endsWith(digitsScanned) || digitsScanned.endsWith(digitsTarget)) return true;
    }
  }

  return false;
}

export interface BarcodeMatchResult {
  product: Product;
  unitType: 'PRIMARY' | 'SECONDARY';
  unitPrice: number;
  unitName: string;
}

/**
 * Searches a product list for a scanned code across primary barcode, SKU, ID, carton barcode, and secondary barcodes.
 */
export function findProductAndUnitByBarcode(
  products: Product[],
  scannedCode: string
): BarcodeMatchResult | null {
  if (!products || !products.length || !scannedCode) return null;
  const rawCode = scannedCode.trim();
  if (!rawCode) return null;

  // 1. Check Primary Single Product Barcode or SKU
  for (const p of products) {
    if (
      isBarcodeMatch(p.barcode, rawCode) ||
      isBarcodeMatch(p.sku, rawCode) ||
      isBarcodeMatch(p.id, rawCode)
    ) {
      return {
        product: p,
        unitType: 'PRIMARY',
        unitPrice: Number(p.unit?.primarySellingPrice) || 0,
        unitName: p.unit?.primaryUnit || 'Pcs',
      };
    }
  }

  // 2. Check Carton / Secondary Barcode
  for (const p of products) {
    if (
      isBarcodeMatch(p.cartonBarcode, rawCode) ||
      isBarcodeMatch(p.unit?.secondaryBarcode, rawCode)
    ) {
      return {
        product: p,
        unitType: 'SECONDARY',
        unitPrice:
          Number(p.unit?.secondarySellingPrice) ||
          Number(p.unit?.primarySellingPrice) ||
          0,
        unitName: p.unit?.secondaryUnit || 'Box',
      };
    }
  }

  // 3. Secondary check: Substring matching for search terms (if length >= 5)
  const cleanCode = normalizeBarcodeString(rawCode);
  if (cleanCode.length >= 5) {
    for (const p of products) {
      const pBar = normalizeBarcodeString(p.barcode);
      const pSku = normalizeBarcodeString(p.sku);
      const pCarton = normalizeBarcodeString(p.cartonBarcode);
      const pSec = normalizeBarcodeString(p.unit?.secondaryBarcode);

      if (pBar && (pBar.includes(cleanCode) || cleanCode.includes(pBar))) {
        return {
          product: p,
          unitType: 'PRIMARY',
          unitPrice: Number(p.unit?.primarySellingPrice) || 0,
          unitName: p.unit?.primaryUnit || 'Pcs',
        };
      }
      if (pSku && (pSku.includes(cleanCode) || cleanCode.includes(pSku))) {
        return {
          product: p,
          unitType: 'PRIMARY',
          unitPrice: Number(p.unit?.primarySellingPrice) || 0,
          unitName: p.unit?.primaryUnit || 'Pcs',
        };
      }
      if (
        (pCarton && (pCarton.includes(cleanCode) || cleanCode.includes(pCarton))) ||
        (pSec && (pSec.includes(cleanCode) || cleanCode.includes(pSec)))
      ) {
        return {
          product: p,
          unitType: 'SECONDARY',
          unitPrice:
            Number(p.unit?.secondarySellingPrice) ||
            Number(p.unit?.primarySellingPrice) ||
            0,
          unitName: p.unit?.secondaryUnit || 'Box',
        };
      }
    }
  }

  return null;
}
