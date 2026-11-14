import { expect, it } from "vitest";
import config from "@/next.config";
it("applies upload sandboxing to files handled directly by Next", async () => {
 const rule=(await config.headers!()).find(rule=>rule.source==="/uploads/:path*");
 const headers=Object.fromEntries(rule!.headers.map(header=>[header.key.toLowerCase(),header.value]));
 expect(headers["x-content-type-options"]).toBe("nosniff");
 expect(headers["content-security-policy"]).toContain("default-src 'none'");
 expect(headers["content-security-policy"]).toContain("sandbox");
 expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
});
