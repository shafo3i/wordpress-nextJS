import en from "@/templates/language/en.json";
import { beforeEach, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({
  active: vi.fn(),
  label: "Unsubscribe",
  send: vi.fn(),
  config: vi.fn(),
  settings: vi.fn(),
}))
vi.mock("@/services/plugin.service", () => ({
  getActivePluginSlugs: mocks.active,
}))
vi.mock("@/lib/email", () => ({
  sendEmail: mocks.send,
  getSmtpSettings: mocks.settings,
}))
vi.mock("@/lib/plugins/config", () => ({ getPluginConfig: mocks.config }))
vi.mock("@/lib/email-language", () => ({
  getEmailLanguage: async () => ({
    code: "en",
    defaultCode: "en",
    direction: "ltr",
    siteName: "Newsroom",
    dict: { ...en, "site.newsletter.unsubscribe": mocks.label },
  }),
}))
vi.mock("@/services/settings.service", () => ({ getOptions: async () => ({}) }))
import { sendConfirmedNewsletterWelcome } from "@/lib/newsletter/email"
beforeEach(() => {
  vi.clearAllMocks()
  mocks.active.mockResolvedValue([])
})
it("does not send optional welcome mail after plugin deactivation", async () => {
  await sendConfirmedNewsletterWelcome({
    id: "fixture",
    email: "reader@example.test",
    name: "Reader",
    locale: "en",
  })
  expect(mocks.send).not.toHaveBeenCalled()
  expect(mocks.config).not.toHaveBeenCalled()
})
it("does not send when the plugin welcome switch is disabled", async () => {
  mocks.active.mockResolvedValue(["newsletter"])
  mocks.config.mockResolvedValue({ sendWelcomeEmail: false })
  mocks.settings.mockResolvedValue({ enable_newsletter_notifications: "1" })
  await sendConfirmedNewsletterWelcome({
    id: "fixture",
    email: "reader@example.test",
    name: "Reader",
    locale: "en",
  })
  expect(mocks.send).not.toHaveBeenCalled()
})

it("escapes translated unsubscribe labels inside HTML email", async () => {
  vi.stubEnv("BETTER_AUTH_SECRET", "isolated-test-secret-not-production");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://newsletter.test");
  mocks.label = '<img src=x onerror="alert(1)">';
  mocks.active.mockResolvedValue(["newsletter"]);
  mocks.config.mockResolvedValue({ sendWelcomeEmail: true });
  mocks.settings.mockResolvedValue({ enable_newsletter_notifications: "1" });
  try {
    await sendConfirmedNewsletterWelcome({ id:"fixture",email:"reader@example.test",name:"Reader",locale:"en" });
    const message = mocks.send.mock.calls[0][0];
    expect(message.html).not.toContain("<img src=x");
    expect(message.html).toContain("&#60;img");
  } finally { mocks.label = "Unsubscribe"; vi.unstubAllEnvs(); }
});
