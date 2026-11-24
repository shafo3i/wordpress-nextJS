import { useState } from "react"
import { createRoot } from "react-dom/client"
import { MenuItemsAccordion } from "../../app/(admin)/admincp/menus/_components/menu-items-accordion"
import en from "../../templates/language/en.json"
import ar from "../../templates/language/ar.json"
function Fixture({ locale }: { locale: "en" | "ar" }) {
  const [items, setItems] = useState<{ title: string; url: string }[]>([])
  const dict = locale === "ar" ? ar : en
  return (
    <>
      <MenuItemsAccordion
        pages={[]}
        categories={[]}
        dict={dict}
        direction={locale === "ar" ? "rtl" : "ltr"}
        podcastDirectory={{
          title: dict["site.podcasts.title"],
          url: locale === "ar" ? "/podcasts" : "/en/podcasts",
        }}
        onAddItems={(added) => setItems([...items, ...added])}
      />
      <nav aria-label="Selected items">
        {items.map((item, index) => (
          <a key={index} href={item.url}>
            {item.title}
          </a>
        ))}
      </nav>
    </>
  )
}
export function render(locale: "en" | "ar") {
  createRoot(document.getElementById("fixture")!).render(
    <Fixture locale={locale} />
  )
}
