import { Mail } from "lucide-react"
import { SocialProfileIcon } from "./social-links"
export function ShareNetworkIcon({
  network,
}: {
  network: "facebook" | "x" | "whatsapp" | "telegram" | "linkedin" | "email"
}) {
  if (network === "email") return <Mail aria-hidden className="size-3.5" />
  if (network === "facebook" || network === "x" || network === "linkedin")
    return (
      <span className="block size-3.5" aria-hidden>
        <SocialProfileIcon
          networkKey={
            network === "facebook"
              ? "socialFacebook"
              : network === "x"
                ? "socialX"
                : "socialLinkedin"
          }
        />
      </span>
    )
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-3.5"
      fill="currentColor"
      aria-hidden
    >
      {network === "telegram" ? (
        <path d="M21.7 3.3 2.5 10.7c-1.3.5-1.3 1.2-.2 1.5l4.9 1.5 1.9 5.8c.2.7.1 1 .9 1 .6 0 .9-.3 1.2-.6l2.4-2.3 5 3.7c.9.5 1.5.3 1.7-.9l3.2-15c.3-1.5-.6-2.2-1.8-1.7ZM8 13.4 19 6.5c.5-.3.9-.1.5.2l-9.1 8.2-.4 4.3-2-5.8Z" />
      ) : (
        <path d="M20.5 3.5A11.9 11.9 0 0 0 1.8 17.8L.1 24l6.4-1.7A11.9 11.9 0 0 0 24 11.9c0-3.2-1.2-6.2-3.5-8.4ZM12 21.8a9.9 9.9 0 0 1-5-1.4l-.4-.2-3.8 1 1-3.7-.3-.4A9.9 9.9 0 1 1 12 21.8Zm5.4-7.4c-.3-.1-1.7-.8-2-.9-.2-.1-.4-.1-.6.2l-.9 1.1c-.2.2-.3.2-.6.1-1.8-.9-3-2.4-3.5-3.2-.2-.3 0-.4.1-.6l.5-.5.3-.5c.1-.2 0-.4 0-.5l-.9-2.1c-.2-.5-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.3-.2.3-1 1-1 2.4s1.1 2.8 1.2 3c.2.2 2.1 3.2 5.1 4.5.7.3 1.2.5 1.7.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.1-1.4-.1-.2-.3-.3-.6-.4Z" />
      )}
    </svg>
  )
}
