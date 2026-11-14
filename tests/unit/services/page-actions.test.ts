import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/templates/language/en.json";
const mocks=vi.hoisted(()=>({guard:vi.fn(),create:vi.fn(),update:vi.fn(),quick:vi.fn(),trash:vi.fn(),restore:vi.fn(),remove:vi.fn(),revalidate:vi.fn()}));
vi.mock("@/lib/authMIddleware",()=>({verifyAdmin:mocks.guard}));
vi.mock("@/services/page.service",()=>({createPage:mocks.create,updatePage:mocks.update,quickUpdatePage:mocks.quick,trashPages:mocks.trash,restorePages:mocks.restore,deletePages:mocks.remove,PageMutationError:class extends Error{}}));
vi.mock("@/components/admin/admin-shell",()=>({getAdminLanguageContext:async()=>({dict:en})}));
vi.mock("next/cache",()=>({revalidatePath:mocks.revalidate}));
vi.mock("next/navigation",()=>({redirect:()=>{throw Error("NEXT_REDIRECT");},unstable_rethrow:(error:Error)=>{if(error.message==="NEXT_REDIRECT")throw error;}}));
import { savePageAction, updatePageAction, quickUpdatePageAction, movePagesToTrashAction, restorePagesAction, deletePagesPermanentlyAction } from "@/app/(admin)/admincp/pages/action";
const form=(values:Record<string,string>)=>{const data=new FormData();for(const [key,value]of Object.entries(values))data.set(key,value);return data;};
beforeEach(()=>{vi.resetAllMocks();mocks.guard.mockResolvedValue({user:{id:"admin",role:"admin"}});});
describe("Pages actions",()=>{
 it("preserves authorization redirects for every action",async()=>{
  mocks.guard.mockRejectedValue(Error("NEXT_REDIRECT"));
  for(const run of [()=>savePageAction(new FormData()),()=>updatePageAction(new FormData()),()=>quickUpdatePageAction({id:"1",title:"Title"}),()=>movePagesToTrashAction(["1"]),()=>restorePagesAction(["1"]),()=>deletePagesPermanentlyAction(["1"])])await expect(run()).rejects.toThrow("NEXT_REDIRECT");
  for(const service of [mocks.create,mocks.update,mocks.quick,mocks.trash,mocks.restore,mocks.remove])expect(service).not.toHaveBeenCalled();
 });
 it("redacts database errors and does not invalidate failed changes",async()=>{
  mocks.remove.mockRejectedValue(Error("private SQL with credentials"));expect(await deletePagesPermanentlyAction(["1"])).toEqual({success:false,error:en["admin.pages.error.failed"]});expect(mocks.revalidate).not.toHaveBeenCalled();
 });
 it("strips forged ownership, content type and internal metadata from the form",async()=>{
  await expect(savePageAction(form({title:"Title",userId:"forged",postType:"post",pageTemplate:"landing",postAuthor:"forged",studioData:"arbitrary"}))).rejects.toThrow("NEXT_REDIRECT");
  const input=mocks.create.mock.calls[0][0];expect(input).toMatchObject({title:"Title",template:"landing"});for(const key of ["userId","postType","postAuthor","studioData"])expect(input).not.toHaveProperty(key);
 });
 it("returns localized error keys to keep the page editor mounted after a failed save",async()=>{
  mocks.update.mockRejectedValue(Error("private database details"));
  expect(await updatePageAction(form({id:"1",title:"Unsaved title"}))).toEqual({success:false,error:"admin.pages.error.failed"});
  expect(mocks.revalidate).not.toHaveBeenCalled();
 });
 it("validates quick edits and entire bulk batches before invoking services",async()=>{
  expect((await quickUpdatePageAction({id:"1",title:"Title",date:"not-a-date"})).success).toBe(false);
  expect((await movePagesToTrashAction(["1","not-an-id"])).success).toBe(false);
  expect((await restorePagesAction([])).success).toBe(false);
  expect(mocks.quick).not.toHaveBeenCalled();expect(mocks.trash).not.toHaveBeenCalled();expect(mocks.restore).not.toHaveBeenCalled();
 });
 it("preserves omitted edit fields and invalidates public layouts on success",async()=>{
  await expect(updatePageAction(form({id:"1",title:"Title"}))).rejects.toThrow("NEXT_REDIRECT");
  const input=mocks.update.mock.calls[0][1];for(const key of ["content","postPassword","featuredImageId"])expect(input).not.toHaveProperty(key);
  expect(mocks.revalidate).toHaveBeenCalledWith("/","layout");
 });
});
