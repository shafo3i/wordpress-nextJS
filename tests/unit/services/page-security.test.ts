import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import type { DB } from "@/db";
import { wpPosts, wpPostmeta } from "@/db/schema/cms-posts";
const mocks = vi.hoisted(() => ({ guard: vi.fn(), language: vi.fn(), option: vi.fn(), postLanguage: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/db", () => ({ db: {} }));
vi.mock("@/lib/authMIddleware", () => ({ verifyAdmin: mocks.guard }));
vi.mock("@/services/language.service", () => ({ setPostLanguage: mocks.language, getDefaultLanguage: async () => ({code:"en"}), getPostLanguage: mocks.postLanguage }));
vi.mock("@/services/settings.service", () => ({ getOption: mocks.option }));
import { createPage, updatePage, quickUpdatePage, trashPages, restorePages, deletePages, getPageById, getPages, getPageCounts, getAllParentPageOptions, createDraftStudioPage, saveStudioPageData, setPageStudioMode, uniquePageSlug } from "@/services/page.service";
import { createPageSchema, pageIdSchema, pageQuerySchema, pageIdsSchema } from "@/db/schema/cms-pages";
function databaseWith(selects: unknown[][], inserted: unknown[][] = []) {
 const dialect = new PgDialect();
 const predicates: {sql:string;params:unknown[]}[] = [];
 const writes: {table:unknown;values?:Record<string,unknown>|unknown[];sql?:string;params?:unknown[]}[] = [];
 const tx = {
  execute: vi.fn().mockResolvedValue(undefined),
  select: vi.fn(() => {
   const rows = selects.shift(); if (!rows) throw new Error("Unexpected query");
   const pending = Promise.resolve(rows);
   const chain = {from:()=>chain,innerJoin:()=>chain,leftJoin:()=>chain,orderBy:()=>chain,offset:()=>chain,groupBy:()=>chain,limit:()=>chain,for:()=>chain,
    where:(condition:SQL)=>{predicates.push(dialect.sqlToQuery(condition));return chain;},then:pending.then.bind(pending)};
   return chain;
  }),
  insert: vi.fn(table=>({values:(values:Record<string,unknown>|unknown[])=>{
   writes.push({table,values}); const result=Promise.resolve(inserted.shift() || []);
   return {then:result.then.bind(result),returning:()=>result};
  }})),
  update: vi.fn(table=>({set:(values:Record<string,unknown>)=>({where:async(condition:SQL)=>{writes.push({table,values,...dialect.sqlToQuery(condition)});}})})),
  delete: vi.fn(table=>({where:async(condition:SQL)=>{writes.push({table,...dialect.sqlToQuery(condition)});}})),
 };
 let committed=false;
 const transaction=vi.fn(async(callback:(tx:unknown)=>unknown)=>{const result=await callback(tx);committed=true;return result;});
 const database={...tx,transaction} as unknown as DB;
 return {database,tx,predicates,writes,transaction,committed:()=>committed};
}
const existing={id:BigInt(1),parent:BigInt(0),status:"draft",slug:"existing-page",date:new Date("2025-01-01T00:00:00Z")};
beforeEach(()=>{vi.clearAllMocks();mocks.guard.mockResolvedValue({user:{id:"session-admin",role:"admin"}});mocks.option.mockResolvedValue("posts");mocks.language.mockResolvedValue(undefined);mocks.postLanguage.mockResolvedValue(null);});
describe("Pages service security",()=>{
 it("denies every admin service before querying or mutating",async()=>{
  mocks.guard.mockRejectedValue(new Error("Forbidden"));const test=databaseWith([]);
  const operations=[()=>createPage({title:"Title"},test.database),()=>updatePage("1",{id:"1",title:"Title"},test.database),()=>quickUpdatePage({id:"1",title:"Title"},test.database),()=>trashPages(["1"],test.database),()=>restorePages(["1"],test.database),()=>deletePages(["1"],test.database),()=>getPageById("1",test.database),()=>getPages({},test.database),()=>getPageCounts({},test.database),()=>getAllParentPageOptions(undefined,undefined,test.database),()=>createDraftStudioPage({title:"Title"},test.database),()=>saveStudioPageData({},test.database),()=>setPageStudioMode("1",true,test.database),()=>uniquePageSlug("title",undefined,test.database)];
  for(const operation of operations) await expect(operation()).rejects.toThrow("Forbidden");
  expect(test.tx.select).not.toHaveBeenCalled();expect(test.transaction).not.toHaveBeenCalled();
 });
 it.each(["0","-1","1.5","9223372036854775808",Number.MAX_SAFE_INTEGER+1,"1 OR 1=1"])("rejects invalid IDs: %s",id=>{expect(pageIdSchema.safeParse(id).success).toBe(false);});
 it("bounds bodies, statuses, batch size and pagination",()=>{
  for(const input of [{title:"Title",content:"a".repeat(1_000_001)},{title:"Title",status:"administrator"},{title:"Title",menuOrder:Infinity},{title:"Title",menuOrder:1.1},{title:"Title",template:"../../file"}]) expect(createPageSchema.safeParse(input).success).toBe(false);
  expect(pageIdsSchema.safeParse(Array(101).fill("1")).success).toBe(false);
  for(const input of [{page:Infinity},{page:-1},{pageSize:100000},{search:"a".repeat(201)}]) expect(pageQuerySchema.safeParse(input).success).toBe(false);
 });
 it.each(["update","delete"])("rejects non-page or missing %s targets before related data writes",async(operation)=>{
  const test=databaseWith([[]]);
  await expect(operation==="update"?updatePage("8",{id:"8",title:"Title",featuredImageId:"4"},test.database):deletePages(["8"],test.database)).rejects.toThrow("missing");
  expect(test.writes).toHaveLength(0);expect(test.committed()).toBe(false);
  expect(test.predicates[0].params).toContain("page");expect(test.predicates[0].params).toContain(BigInt(8));
 });
 it("rejects a mixed delete batch atomically",async()=>{
  const test=databaseWith([[{...existing,status:"trash"}]]);
  await expect(deletePages(["1","8"],test.database)).rejects.toThrow("missing");expect(test.writes).toHaveLength(0);
 });
 it("requires Trash before permanent deletion and restores only trashed pages",async()=>{
  for(const operation of [deletePages,restorePages]){const test=databaseWith([[existing]]);await expect(operation(["1"],test.database)).rejects.toThrow("invalid");expect(test.writes).toHaveLength(0);}
 });
 it("does not allow the selected homepage to be trashed",async()=>{
  mocks.option.mockImplementation(async(key:string)=>key==="show_on_front"?"page":"1");const test=databaseWith([[existing]]);
  await expect(trashPages(["1"],test.database)).rejects.toThrow("homepage");expect(test.writes).toHaveLength(0);
 });
 it("deletes only verified pages and reparents child pages inside the transaction",async()=>{
  const test=databaseWith([[{...existing,status:"trash"}]]);await deletePages(["1","1"],test.database);
  expect(test.committed()).toBe(true);expect(test.writes).toHaveLength(5);expect(test.writes[0].values).toEqual({postParent:BigInt(0)});
  expect(test.writes.at(-1)?.params).toEqual([BigInt(1),"page"]);
 });
 it.each(["self","descendant","missing"])("rejects %s parent relationships before saving",async(kind)=>{
  const selects=kind==="self"?[[existing]]:kind==="descendant"?[[existing],[{parent:BigInt(1)}]]:[[existing],[]];
  const test=databaseWith(selects);await expect(updatePage("1",{id:"1",title:"Title",postParent:kind==="self"?"1":"2"},test.database)).rejects.toThrow("parent");expect(test.writes).toHaveLength(0);
 });
 it("rejects an invalid featured image before any insert",async()=>{
  const test=databaseWith([[]]);await expect(createPage({title:"Title",featuredImageId:"2"},test.database)).rejects.toThrow("image");
  expect(test.predicates[0].params).toContain("attachment");expect(test.predicates[0].params).toContain("image/%");expect(test.writes).toHaveLength(0);
 });
 it("rejects post IDs as page translation sources",async()=>{
  const test=databaseWith([[]]);await expect(createPage({title:"Title",translationOf:"2",languageCode:"ar"},test.database)).rejects.toThrow("missing");
  expect(test.predicates[0].params).toContain("page");expect(test.writes).toHaveLength(0);
 });
 it("creates sanitized HTML using session authorship and a draft default",async()=>{
  const test=databaseWith([[]],[[{id:BigInt(9)}]]);
  expect(await createPage({title:"Title",content:'<p onclick="alert(1)">Safe</p><script>alert(1)</script><iframe src="https://evil.test"></iframe>',userId:"forged",languageCode:"en"},test.database)).toBe("9");
  const values=test.writes.find(write=>write.table===wpPosts)?.values as Record<string,unknown>;
  expect(values.postAuthor).toBe("session-admin");expect(values.postStatus).toBe("draft");expect(values.postContent).toBe("<p>Safe</p>");expect(test.committed()).toBe(true);
  expect(mocks.language).toHaveBeenCalledWith(BigInt(9),"en",undefined,expect.anything());
 });
 it("rolls back page/meta creation when language assignment fails",async()=>{
  mocks.language.mockRejectedValue(new Error("invalid language"));const test=databaseWith([[]],[[{id:BigInt(9)}]]);
  await expect(createPage({title:"Title",template:"default",languageCode:"en"},test.database)).rejects.toThrow("invalid language");expect(test.committed()).toBe(false);
 });
 it("preserves omitted content, password, image, slug, date and draft status",async()=>{
  const test=databaseWith([[existing]]);await updatePage("1",{id:"1",title:"New title"},test.database);
  expect(test.writes).toHaveLength(1);const values=test.writes[0].values as Record<string,unknown>;
  expect(values.postName).toBe("existing-page");for(const key of ["postContent","postPassword","postStatus"])expect(values).not.toHaveProperty(key);
  expect(test.writes.some(write=>write.table===wpPostmeta)).toBe(false);
  const quick=databaseWith([[existing]]);expect(await quickUpdatePage({id:"1",title:"Title"},quick.database)).toMatchObject({status:"draft",date:"2025-01-01T00:00:00.000Z"});
 });
 it("explicitly clearing an image removes only its own thumbnail metadata",async()=>{
  const test=databaseWith([[existing]]);await updatePage("1",{id:"1",title:"Title",featuredImageId:""},test.database);
  expect(test.writes[1].params).toEqual([BigInt(1),"_thumbnail_id"]);
 });
 it("does not fall back to other languages when no parent pages match",async()=>{
  const test=databaseWith([[]]);expect(await getAllParentPageOptions(undefined,"ar",test.database)).toEqual([]);expect(test.tx.select).toHaveBeenCalledTimes(1);
 });
 it("preserves suffixes on 200-character slug collisions",async()=>{
  const test=databaseWith([[{id:BigInt(1)}],[]]);expect(await uniquePageSlug("a".repeat(200),undefined,test.database)).toBe("a".repeat(198)+"-2");
 });
 it("includes draft translation navigation only in the guarded admin read",async()=>{
  mocks.postLanguage.mockResolvedValue({languageCode:"en",translationGroupId:"group"});
  const draft={postId:BigInt(2),slug:"draft",title:"Draft translation",languageCode:"ar",languageName:"Arabic",nativeName:"Arabic",direction:"rtl",isDefault:false};
  const test=databaseWith([[{...existing,title:"Page",content:"<p>Text</p><script>alert(1)</script>",excerpt:"",postParent:BigInt(0),menuOrder:0,commentStatus:"closed",pingStatus:"closed",postPassword:"secret"}],[],[draft]]);
  const result=await getPageById("1",test.database);
  expect(result?.translations).toEqual([draft]);expect(result?.page.content).toBe("<p>Text</p>");expect(result?.page.postPassword).toBe("secret");
  const predicate=test.predicates.at(-1)!;expect(predicate.params).toContain("page");expect(predicate.params).not.toContain("publish");expect(predicate.params).toContain("trash");
 });
 it("ignores malformed edit route IDs instead of querying",async()=>{
  const test=databaseWith([]);expect(await getPageById("../../",test.database)).toBeNull();expect(test.tx.select).not.toHaveBeenCalled();
 });
});
