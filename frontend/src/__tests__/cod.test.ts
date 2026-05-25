import { describe, it, expect } from "vitest";

const COD_MIN = 199;
const COD_MAX = 1499;

const isValidCodAmount = (amount: number): boolean =>
  amount >= COD_MIN && amount <= COD_MAX;

describe("COD amount validation", () => {
  it("amount 150 should be below COD minimum (199)", () => {
    expect(150 < COD_MIN).toBe(true);
    expect(isValidCodAmount(150)).toBe(false);
  });

  it("amount 1600 should be above COD maximum (1499)", () => {
    expect(1600 > COD_MAX).toBe(true);
    expect(isValidCodAmount(1600)).toBe(false);
  });

  it("amount 500 should be valid for COD", () => {
    expect(isValidCodAmount(500)).toBe(true);
  });

  it("amount 199 should be valid (lower boundary)", () => {
    expect(isValidCodAmount(199)).toBe(true);
  });

  it("amount 1499 should be valid (upper boundary)", () => {
    expect(isValidCodAmount(1499)).toBe(true);
  });
});
