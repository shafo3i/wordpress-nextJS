import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {beforeEach,describe,expect,it,vi} from "vitest";
import en from "@/templates/language/en.json";
const mocks=vi.hoisted(()=>({guard:vi.fn(),read:vi.fn(),editor:vi.fn(),parents:vi.fn()}));
vi.mock("@/lib/authMIddleware",()=>({verifyAdminOrEditor:mocks.guard}));
vi.mock("@/components/admin/admin-shell",()=>({AdminShell:({children}:{children:unknown})=>children,getAdminLanguageContext:async()=>({dict:en,direction:"ltr",code:"en",allLanguages:[]})}));
vi.mock("@/components/admin/posts/editor/classic-post-editor",()=>({ClassicPostEditor:(props:unknown)=>{mocks.editor(props);return createElement("div");}}));
vi.mock("@/app/(admin)/admincp/pages/query",()=>({getPageByIdQuery:mocks.read,getParentPagesQuery:mocks.parents}));
vi.mock("@/app/(admin)/admincp/pages/action",()=>({updatePageAction:vi.fn()}));
vi.mock("next/link",()=>({default:"a"}));
vi.mock("next/navigation",()=>({notFound:()=>{throw Error("NOT_FOUND");}}));
import EditPage from "@/app/(admin)/admincp/pages/[id]/edit/page";
beforeEach(()=>{vi.clearAllMocks();mocks.guard.mockResolvedValue({user:{role:"admin"}});mocks.parents.mockResolvedValue([]);});
describe("Page editor visibility settings",()=>{
 it("preserves the password, discussion flags and draft translation links when opening the editor",async()=>{
  mocks.read.mockResolvedValue({page:{id:"1",title:"Page",content:"<p>Content</p>",excerpt:"",featuredImageId:"",menuOrder:0,postParent:"0",status:"private",postPassword:"existing-password",commentStatus:"closed",pingStatus:"closed",template:"default",languageCode:"en",isStudioBuilder:false},translations:[{languageCode:"ar",postId:BigInt(2),title:"Draft translation"}]});
  renderToStaticMarkup(await EditPage({params:Promise.resolve({id:"1"})}));
  expect(mocks.editor.mock.calls[0][0]).toMatchObject({initialPostPassword:"existing-password",initialStatus:"private",initialCommentStatus:"closed",initialPingStatus:"closed",translations:[{languageCode:"ar",postId:"2",title:"Draft translation"}]});
 });
 it("returns not found when the page query rejects the target ID",async()=>{
  mocks.read.mockResolvedValue(null);await expect(EditPage({params:Promise.resolve({id:"wrong-id"})})).rejects.toThrow("NOT_FOUND");expect(mocks.editor).not.toHaveBeenCalled();
 });
});
