import { describe, expect, it, vi } from "vitest";
import { generateSecurePassword } from "@/lib/password";
describe("credential password generation", () => {
  it("uses secure randomness and preserves all required character groups", () => {
    const insecure = vi.spyOn(Math, "random").mockImplementation(() => {
      throw new Error("insecure random");
    });
    try {
      const passwords = Array.from({ length: 30 }, () =>
        generateSecurePassword(20)
      );
      expect(new Set(passwords).size).toBe(passwords.length);
      for (const password of passwords) {
        expect(password).toHaveLength(20);
        expect(password).toMatch(/[a-z]/);
        expect(password).toMatch(/[A-Z]/);
        expect(password).toMatch(/[0-9]/);
        expect(password).toMatch(/[^a-zA-Z0-9]/);
      }
    } finally {
      insecure.mockRestore();
    }
  });
  it.each([0, 8, 129, 14.5, Infinity])(
    "rejects unsafe/unbounded lengths %s",
    (value) => {
      expect(() => generateSecurePassword(value)).toThrow(
        "invalid_password_length"
      );
    }
  );
});
