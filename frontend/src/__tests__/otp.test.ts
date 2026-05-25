import { describe, it, expect } from "vitest";

const OTP_REGEX = /^\d{6}$/;

const isValidOtp = (otp: string): boolean => OTP_REGEX.test(otp);

describe("OTP format validation", () => {
  it("6-digit numeric string should be a valid OTP", () => {
    expect(isValidOtp("123456")).toBe(true);
  });

  it("5-digit number should be invalid OTP", () => {
    expect(isValidOtp("12345")).toBe(false);
  });

  it("non-numeric string should be invalid OTP", () => {
    expect(isValidOtp("abcdef")).toBe(false);
  });

  it("7-digit number should be invalid OTP", () => {
    expect(isValidOtp("1234567")).toBe(false);
  });

  it("empty string should be invalid OTP", () => {
    expect(isValidOtp("")).toBe(false);
  });
});
