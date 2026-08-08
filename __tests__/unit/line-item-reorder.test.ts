/**
 * Property-Based Tests for Line Item Reorder.
 *
 * WHAT IT IS: Tests that verify moving a line item from one position to another
 * never loses or duplicates data — only the order changes.
 *
 * WHY IT EXISTS: Drag-and-drop reordering is a common source of bugs. If the
 * splice logic is off by one, items can vanish or appear twice. These tests
 * generate hundreds of random lists and reorder operations to catch such bugs.
 *
 * REAL WORLD ANALOGY: Imagine shuffling a deck of cards. After every shuffle,
 * you still have exactly 52 cards — none missing, none duplicated.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type { LineItem } from "../../lib/types";

// ─── Pure reorder function (same logic as the Zustand store) ─────────────────

/**
 * Reorders an array by moving the item at fromIndex to toIndex.
 * This is the exact same splice logic used in useInvoiceStore.reorderLineItems.
 */
function reorderLineItems(
  items: LineItem[],
  fromIndex: number,
  toIndex: number
): LineItem[] {
  const result = [...items];
  const [moved] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, moved);
  return result;
}

// ─── Generators ──────────────────────────────────────────────────────────────

/**
 * Generates a valid LineItem with a unique ID and random data.
 * Each item gets a unique counter-based ID to make them easily distinguishable.
 */
let idCounter = 0;

function lineItemArb(): fc.Arbitrary<LineItem> {
  return fc
    .record({
      description: fc.string({ minLength: 1, maxLength: 50 }),
      quantity: fc.double({ min: 0.01, max: 10_000, noNaN: true, noDefaultInfinity: true }),
      unitPrice: fc.double({ min: 0.01, max: 999_999.99, noNaN: true, noDefaultInfinity: true }),
      unitOfMeasure: fc.string({ minLength: 1, maxLength: 20 }),
    })
    .map((data) => ({
      id: `item-${++idCounter}`,
      description: data.description,
      quantity: Math.round(data.quantity * 100) / 100,
      unitPrice: Math.round(data.unitPrice * 100) / 100,
      unitOfMeasure: data.unitOfMeasure,
      lineTotal: Math.round(data.quantity * data.unitPrice * 100) / 100,
    }));
}

/**
 * Generates an array of 2-20 line items, each with a unique UUID as ID.
 * Uses UUIDs to avoid any counter-collision issues between test runs.
 */
function lineItemsWithValidReorder(): fc.Arbitrary<{
  items: LineItem[];
  fromIndex: number;
  toIndex: number;
}> {
  return fc
    .array(lineItemArb(), { minLength: 2, maxLength: 20 })
    .chain((items) => {
      // Give each item a truly unique ID based on its index in the generated array
      const uniqueItems = items.map((item, i) => ({
        ...item,
        id: `unique-${i}-${Math.random().toString(36).slice(2)}`,
      }));

      const maxIndex = uniqueItems.length - 1;

      return fc
        .tuple(
          fc.integer({ min: 0, max: maxIndex }),
          fc.integer({ min: 0, max: maxIndex })
        )
        .map(([fromIndex, toIndex]) => ({
          items: uniqueItems,
          fromIndex,
          toIndex,
        }));
    });
}

// ─── Property 5: Line Item Reorder Preserves Data ────────────────────────────
// Feature: faktura-invoice-generator, Property 5: Line Item Reorder Preserves Data

describe("Property 5: Line Item Reorder Preserves Data", () => {
  /**
   * Validates: Requirements 6.4
   * After reorder, the resulting list has the same length as the original.
   */
  it("reorder preserves array length", () => {
    fc.assert(
      fc.property(lineItemsWithValidReorder(), ({ items, fromIndex, toIndex }) => {
        const result = reorderLineItems(items, fromIndex, toIndex);
        expect(result.length).toBe(items.length);
      }),
      { numRuns: 200 }
    );
  });

  /**
   * Validates: Requirements 6.4
   * After reorder, the set of IDs is identical — no items lost or duplicated.
   */
  it("reorder preserves all item IDs (no loss or duplication)", () => {
    fc.assert(
      fc.property(lineItemsWithValidReorder(), ({ items, fromIndex, toIndex }) => {
        const result = reorderLineItems(items, fromIndex, toIndex);

        const originalIds = items.map((item) => item.id).sort();
        const resultIds = result.map((item) => item.id).sort();

        expect(resultIds).toEqual(originalIds);
      }),
      { numRuns: 200 }
    );
  });

  /**
   * Validates: Requirements 6.4
   * After reorder, each item retains its original data (description, quantity,
   * unitPrice, unitOfMeasure, lineTotal) — only position changes.
   */
  it("reorder preserves all item data (same IDs have same data)", () => {
    fc.assert(
      fc.property(lineItemsWithValidReorder(), ({ items, fromIndex, toIndex }) => {
        const result = reorderLineItems(items, fromIndex, toIndex);

        // Build a lookup of original items by ID
        const originalById = new Map(items.map((item) => [item.id, item]));

        // Every item in result should match its original exactly
        for (const resultItem of result) {
          const original = originalById.get(resultItem.id);
          expect(original).toBeDefined();
          expect(resultItem.description).toBe(original!.description);
          expect(resultItem.quantity).toBe(original!.quantity);
          expect(resultItem.unitPrice).toBe(original!.unitPrice);
          expect(resultItem.unitOfMeasure).toBe(original!.unitOfMeasure);
          expect(resultItem.lineTotal).toBe(original!.lineTotal);
        }
      }),
      { numRuns: 200 }
    );
  });

  /**
   * Validates: Requirements 6.4
   * After reorder, there are no duplicate IDs in the result.
   */
  it("reorder produces no duplicate IDs", () => {
    fc.assert(
      fc.property(lineItemsWithValidReorder(), ({ items, fromIndex, toIndex }) => {
        const result = reorderLineItems(items, fromIndex, toIndex);

        const ids = result.map((item) => item.id);
        const uniqueIds = new Set(ids);

        expect(uniqueIds.size).toBe(ids.length);
      }),
      { numRuns: 200 }
    );
  });

  /**
   * Validates: Requirements 6.4
   * The moved item ends up at the correct target position.
   */
  it("the moved item is at the expected toIndex position", () => {
    fc.assert(
      fc.property(lineItemsWithValidReorder(), ({ items, fromIndex, toIndex }) => {
        const result = reorderLineItems(items, fromIndex, toIndex);
        const movedItemId = items[fromIndex].id;

        expect(result[toIndex].id).toBe(movedItemId);
      }),
      { numRuns: 200 }
    );
  });

  /**
   * Validates: Requirements 6.4
   * When fromIndex equals toIndex, the list is unchanged (identity operation).
   */
  it("reorder with same from/to index produces identical list", () => {
    fc.assert(
      fc.property(
        fc.array(lineItemArb(), { minLength: 2, maxLength: 20 }).map((items) =>
          items.map((item, i) => ({
            ...item,
            id: `same-${i}-${Math.random().toString(36).slice(2)}`,
          }))
        ),
        (items) => {
          // Pick a random valid index
          const index = Math.floor(Math.random() * items.length);
          const result = reorderLineItems(items, index, index);

          // List should be identical when moving item to its own position
          expect(result.map((r) => r.id)).toEqual(items.map((i) => i.id));
        }
      ),
      { numRuns: 200 }
    );
  });
});
