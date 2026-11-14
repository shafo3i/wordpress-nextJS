import {isValidElement,type ReactNode} from "react";
import {describe,expect,it,vi} from "vitest";
vi.mock("@/components/admin/admin-shell",()=>({AdminShell:()=>null,getAdminLanguageContext:async()=>({dict:{},code:"en",direction:"ltr",allLanguages:[]})}));
vi.mock("@/lib/authMIddleware",()=>({verifyAdminOrEditor:async()=>({user:{role:"admin"}})}));
vi.mock("@/app/(admin)/admincp/menus/query",()=>({getMenus:async()=>[{id:"7581",name:"Menu",slug:"menu"}],getMenu:async(id:string)=>({id,name:"Menu",slug:"menu",items:[],locations:[]}),getMenuAvailableItems:async()=>({pages:[],categories:[],posts:[]})}));
vi.mock("@/app/(admin)/admincp/menus/_components",()=>({MenuSelectorBar:()=>null,MenuManagerShell:()=>null}));
import MenusPage from "@/app/(admin)/admincp/menus/page";
function assertSiblingKeys(node:ReactNode){
 if(!isValidElement<{children?:ReactNode}>(node))return;
 const children=node.props.children;
 const siblings=Array.isArray(children)?children:[children];
 const keys=siblings.filter(isValidElement).map(child=>child.key).filter(key=>key!==null);
 expect(new Set(keys).size).toBe(keys.length);
 siblings.forEach(assertSiblingKeys);
}
describe("Menus page component identity",()=>{
 it.each([undefined,"7581","9000"])("gives selector and editor distinct sibling keys for menu %s",async(menu)=>{
  const tree=await MenusPage({searchParams:Promise.resolve({menu})});assertSiblingKeys(tree);
 });
});
