
import {beforeEach,describe,expect,it,vi} from "vitest"
vi.mock("server-only",()=>({}))
const mocks=vi.hoisted(()=>({session:vi.fn(),set:vi.fn(),tx:vi.fn(),read:vi.fn()}))
vi.mock("@/auth",()=>({auth:{api:{getSession:mocks.session}}}))
vi.mock("next/headers",()=>({headers:async()=>new Headers()}))
vi.mock("next/navigation",()=>({redirect:(path:string)=>{throw new Error("redirect:"+path)}}))
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}))
vi.mock("@/db",()=>({db:{select:mocks.read,transaction:mocks.tx}}))
vi.mock("@/services/settings.service",()=>({setOption:mocks.set}))
import {activateTheme,AVAILABLE_THEMES} from "@/lib/themes/loader"
import {getThemesQuery} from "@/app/(admin)/admincp/themes/query"
import {activateThemeAction} from "@/app/(admin)/admincp/themes/actions"
beforeEach(()=>{vi.clearAllMocks();mocks.session.mockResolvedValue({user:{id:"admin",role:"admin"}});mocks.tx.mockImplementation(async fn=>fn({transaction:"fixture"}))})
describe("Themes security",()=>{
 it.each(["editor","author","subscriber"])("denies %s before queries or writes",async role=>{
  mocks.session.mockResolvedValue({user:{role}})
  await expect(getThemesQuery()).rejects.toThrow("redirect:")
  await expect(activateTheme(AVAILABLE_THEMES[0].slug)).rejects.toThrow("redirect:")
  await expect(activateThemeAction(AVAILABLE_THEMES[0].slug)).rejects.toThrow("redirect:")
  expect(mocks.read).not.toHaveBeenCalled();expect(mocks.set).not.toHaveBeenCalled()
 })
 it.each(["../theme","<script>","unknown-theme","x".repeat(101),"", "file:///theme"])("rejects unregistered or invalid slug %s",async slug=>{
  expect(await activateThemeAction(slug)).toEqual({success:false,error:"admin.themes.activation_error"})
  expect(mocks.set).not.toHaveBeenCalled()
 })
 it("writes the three activation options through one transaction",async()=>{
  const theme=AVAILABLE_THEMES[0]
  expect((await activateThemeAction(theme.slug)).success).toBe(true)
  expect(mocks.tx).toHaveBeenCalledOnce()
  expect(mocks.set.mock.calls).toEqual([["stylesheet",theme.slug,{transaction:"fixture"}],["template",theme.slug,{transaction:"fixture"}],["current_theme",theme.name,{transaction:"fixture"}]])
 })
 it("propagates write failure to the transaction and returns no database details",async()=>{
  mocks.set.mockRejectedValue(new Error("private SQL error"))
  expect(await activateThemeAction(AVAILABLE_THEMES[0].slug)).toEqual({success:false,error:"admin.themes.activation_error"})
 })
 it("bounds search before loading themes",async()=>{
  await expect(getThemesQuery("x".repeat(201))).rejects.toThrow()
  expect(mocks.read).not.toHaveBeenCalled()
 })
})
