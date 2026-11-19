import Script from "next/script"

export function SiteAnalytics({ measurementId, nonce }: { measurementId?: string; nonce?: string }) {
  if (!measurementId || !/^G-[A-Z0-9]+$/.test(measurementId)) return null
  return (
    <>
      <Script
        nonce={nonce}
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script
        id="site-google-analytics"
        nonce={nonce}
        strategy="afterInteractive"
      >{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config',${JSON.stringify(measurementId)});`}</Script>
    </>
  )
}
