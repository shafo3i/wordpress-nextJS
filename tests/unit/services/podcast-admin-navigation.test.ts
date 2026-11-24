import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, expect, it, vi } from "vitest"
const state = vi.hoisted(()=>({path:"/admincp"}))
vi.mock("next/navigation",()=>({usePathname:()=>state.path}))
vi.mock("next/link",()=>({default:({children,...props}:Record<string,unknown>)=>createElement("a",props,children as string)}))
import { AdminNav } from "@/components/admin/admin-nav"
const dict={"admin.podcasts.title":"Podcasts","admin.podcasts.shows":"Shows","admin.podcasts.episodes":"Episodes","admin.podcasts.add_episode":"Add episode"}
beforeEach(()=>{state.path="/admincp"})
it("opens the show list directly from the main Podcasts link without the redirect route",()=>{
  const html=renderToStaticMarkup(createElement(AdminNav,{dict,userRole:"admin"}))
  expect(html).not.toContain('href="/admincp/podcasts"')
  expect(html).toContain('href="/admincp/podcasts/shows"')
})
it.each(["/admincp/podcasts/shows","/admincp/podcasts/episodes/2/edit"])("keeps podcast submenus active at %s",path=>{
  state.path=path
  const html=renderToStaticMarkup(createElement(AdminNav,{dict,userRole:"admin"}))
  expect(html).toContain('href="/admincp/podcasts/episodes"')
  expect(html).toContain("Add episode")
})
it("keeps podcast navigation hidden from editors",()=>{
  const html=renderToStaticMarkup(createElement(AdminNav,{dict,userRole:"editor"}))
  expect(html).not.toContain("Podcasts")
})
