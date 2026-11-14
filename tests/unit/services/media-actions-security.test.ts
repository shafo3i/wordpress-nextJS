import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/templates/language/en.json";
import { MAX_MEDIA_UPLOAD_BYTES } from "@/lib/media-upload";
const mocks=vi.hoisted(()=>({guard:vi.fn(),list:vi.fn(),upload:vi.fn(),update:vi.fn(),remove:vi.fn(),details:vi.fn(),revalidate:vi.fn()}));
vi.mock("@/lib/authMIddleware",()=>({verifyPostEditor:mocks.guard}));
vi.mock("@/services/media.service",()=>({getMediaLibraryItems:mocks.list,uploadMediaFile:mocks.upload,updateMediaItem:mocks.update,deleteMediaItems:mocks.remove}));
vi.mock("@/services/media-details.service",()=>({getMediaItemDetails:mocks.details}));
vi.mock("@/components/admin/admin-shell",()=>({getAdminLanguageContext:async()=>({dict:en})}));
vi.mock("next/cache",()=>({revalidatePath:mocks.revalidate}));
vi.mock("next/navigation",()=>({unstable_rethrow:()=>{}}));
import {fetchMediaItemsAction,uploadMediaAction,updateMediaAction,deleteMediaAction,fetchMediaItemAction} from "@/app/(admin)/admincp/media/actions";
function file(){return new File([new Uint8Array([137,80,78,71,13,10,26,10])],"photo.png",{type:"image/png"});}
function form(...files:(File|string)[]){const form=new FormData();for(const file of files)form.append("file",file);return form;}
beforeEach(()=>{vi.clearAllMocks();mocks.guard.mockResolvedValue({user:{id:"editor",role:"editor"}});mocks.upload.mockResolvedValue({id:1});mocks.remove.mockResolvedValue({deletedCount:1});});
describe("media action security",()=>{
 it("denies all actions before inspecting data or accessing services",async()=>{mocks.guard.mockRejectedValue(Error("Forbidden"));for(const run of [()=>fetchMediaItemsAction({}),()=>fetchMediaItemAction(1),()=>uploadMediaAction(new FormData()),()=>updateMediaAction(1,{}),()=>deleteMediaAction([1])])await expect(run()).rejects.toThrow("Forbidden");for(const service of [mocks.list,mocks.upload,mocks.update,mocks.remove,mocks.details])expect(service).not.toHaveBeenCalled();});
 it("rejects invalid IDs and query bounds",async()=>{expect((await fetchMediaItemsAction({page:Infinity})).success).toBe(false);expect((await deleteMediaAction([-1])).success).toBe(false);expect((await fetchMediaItemAction(Number.MAX_SAFE_INTEGER+1)).success).toBe(false);expect(mocks.list).not.toHaveBeenCalled();expect(mocks.remove).not.toHaveBeenCalled();expect(mocks.details).not.toHaveBeenCalled();});
 it("rejects strings, empty batches, too many files and aggregate oversize before upload",async()=>{const large=file();Object.defineProperty(large,"size",{value:MAX_MEDIA_UPLOAD_BYTES+1});for(const data of [form("not a file"),form(),form(...Array.from({length:21},file)),form(large)])expect((await uploadMediaAction(data)).success).toBe(false);expect(mocks.upload).not.toHaveBeenCalled();});
 it("preflights all file types before writing the first batch member",async()=>{const response=await uploadMediaAction(form(file(),new File(["<script>bad</script>"],"bad.html",{type:"text/html"})));expect(response).toMatchObject({success:false,error:en["admin.media.invalid_upload"]});expect(mocks.upload).not.toHaveBeenCalled();});
 it("returns uploaded items with an explicit warning on a partially completed batch",async()=>{mocks.upload.mockResolvedValueOnce({id:1}).mockRejectedValueOnce(Error("private SQL credentials"));expect(await uploadMediaAction(form(file(),file()))).toEqual({success:true,items:[{id:1}],warning:en["admin.media.partial_upload"]});});
 it("redacts unknown storage/database failures",async()=>{mocks.list.mockRejectedValue(Error("private SQL credentials"));expect(await fetchMediaItemsAction({})).toEqual({success:false,error:en["admin.media.error_failed"]});expect(mocks.revalidate).not.toHaveBeenCalled();});
 it("does not accept arbitrary attachment metadata fields in edits",async()=>{expect((await updateMediaAction(1,{title:"Title",guid:"file:///secret"} as never)).success).toBe(false);expect(mocks.update).not.toHaveBeenCalled();});
 it("reports committed deletion counts and cleanup warnings separately",async()=>{mocks.remove.mockResolvedValue({deletedCount:1,cleanupPending:2});expect(await deleteMediaAction([1,1])).toEqual({success:true,deletedCount:1,warning:en["admin.media.cleanup_pending"]});expect(mocks.remove).toHaveBeenCalledWith([1]);});
});
