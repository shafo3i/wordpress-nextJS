import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import en from "@/templates/language/en.json";
import ar from "@/templates/language/ar.json";
vi.mock("next/link",()=>({default:"a"}));
import {PageRowItem} from "@/app/(admin)/admincp/pages/_components/page-row-item";
describe("Page list rendering",()=>{
 it.each([[en,"ltr"],[ar,"rtl"]] as const)("escapes stored labels and confines imported slugs to local routes",(dict,direction)=>{
  const html=renderToStaticMarkup(createElement(PageRowItem,{page:{id:"1",title:'<img src=x onerror=alert(1)>',slug:"//evil.test",status:"draft",authorName:"<script>alert(1)</script>",commentCount:"0",date:"2026-11-13T12:00:00Z"},dict,direction,isSelected:false,onToggleSelect:()=>{},onQuickEdit:()=>{},onTrash:()=>{}}));
  expect(html).not.toContain("<script>");expect(html).not.toContain("<img");expect(html).toContain("&lt;img");expect(html).toContain('href="/%2F%2Fevil.test"');expect(html).toContain(dict["admin.common.edit"]);
 });
});
