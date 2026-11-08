import { twoFactor } from "better-auth/plugins"

/** Reuse Better Auth's challenge/session handling for passwordless sign-ins too. */
export function securedTwoFactor(options?: Parameters<typeof twoFactor>[0]) {
  const plugin = twoFactor(options)
  return {
    ...plugin,
    hooks: {
      ...plugin.hooks,
      after: plugin.hooks.after.map((hook) => ({
        ...hook,
        matcher(context: Parameters<typeof hook.matcher>[0]) {
          return (
            hook.matcher(context) ||
            context.path === "/magic-link/verify" ||
            context.path === "/sign-in/email-otp"
          )
        },
      })),
    },
  }
}
