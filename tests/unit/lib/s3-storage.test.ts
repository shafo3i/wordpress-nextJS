import { describe, expect, it, vi } from "vitest"
vi.mock("server-only", () => ({}))
import { isPublicStorageAddress } from "@/lib/s3-storage"
describe("S3 endpoint network boundary", () => {
  it.each(["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "169.254.169.254", "100.64.1.1", "0.0.0.0", "224.0.0.1", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1", "2001:db8::1", "2002:7f00:1::1"])("blocks internal and reserved DNS answers: %s", address => expect(isPublicStorageAddress(address)).toBe(false))
  it("accepts public IPv4 and IPv6 answers", () => {
    expect(isPublicStorageAddress("8.8.8.8")).toBe(true)
    expect(isPublicStorageAddress("2606:4700:4700::1111")).toBe(true)
  })
})
