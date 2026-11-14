import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import type { DB } from "@/db";
const mocks = vi.hoisted(() => ({ guard: vi.fn(), root: "", uuid: vi.fn() }));
vi.mock("server-only", () => ({})); vi.mock("@/db", () => ({ db: {} }));
vi.mock("@/lib/authMIddleware", () => ({ verifyPostEditor: mocks.guard }));
vi.mock("node:crypto", () => ({ randomUUID: mocks.uuid }));
vi.mock("@/lib/media-files", async importOriginal => {
 const actual = await importOriginal<typeof import("@/lib/media-files")>();
 return { ...actual, mediaRoot: (create: boolean) => actual.mediaRoot(create, mocks.root) };
});
import { uploadMediaFile } from "@/services/media-upload.service";
import { deleteMediaItems } from "@/services/media-delete.service";
import { getMediaLibraryItems, updateMediaItem } from "@/services/media.service";
import { getMediaItemDetails } from "@/services/media-details.service";
import { mediaDeleteIdsSchema, mediaListQuerySchema } from "@/db/schema/cms-media-details";
import { checkedMediaPath, mediaPathParts, prepareMediaDirectory } from "@/lib/media-files";
import { validateMediaUpload } from "@/lib/media-upload";
function databaseWith(responses: unknown[][] = [], failInsert = 0) {
 const writes: { values?: unknown; sql?: string; params?: unknown[] }[] = [], predicates: { sql:string;params:unknown[] }[] = [];
 let inserts = 0, committed = false; const dialect = new PgDialect();
 const tx = {
  execute: vi.fn().mockResolvedValue(undefined),
  select: vi.fn(() => {
   const rows = responses.shift(); if (!rows) throw Error("Unexpected query"); const promise = Promise.resolve(rows);
   const chain = { from: () => chain, innerJoin: () => chain, for: () => chain, limit: () => chain, where: (condition:SQL) => { predicates.push(dialect.sqlToQuery(condition)); return chain; }, then: promise.then.bind(promise) }; return chain;
  }),
  insert: vi.fn(() => ({ values: (value:unknown) => {
   inserts++; writes.push({ values:value });
   const chain = { returning: async () => [{id:BigInt(42)}], then: (resolve:(value:unknown)=>unknown,reject:(error:unknown)=>unknown) => inserts === failInsert ? Promise.reject(Error("DB failure")).then(resolve,reject) : Promise.resolve().then(resolve,reject) }; return chain;
  } })),
  delete: vi.fn(() => ({ where: (condition:SQL) => {
   writes.push(dialect.sqlToQuery(condition)); const pending = Promise.resolve();
   return { then: pending.then.bind(pending), returning: async () => [{id:BigInt(1)}] };
  } })),
  transaction: vi.fn(async (work:(tx:unknown)=>unknown):Promise<unknown> => { const result = await work(tx); committed = true; return result; }),
 };
 return { database:tx as unknown as DB, tx, writes, predicates, committed:()=>committed };
}
let fixture = "", serial = 0;
beforeEach(async () => {
 vi.clearAllMocks(); mocks.guard.mockResolvedValue({ user:{ id:"editor",role:"editor",name:"Editor" } });
 mocks.uuid.mockImplementation(() => `00000000-0000-4000-8000-${String(++serial).padStart(12,"0")}`);
 const base = path.resolve(process.cwd(),".local"); await fs.mkdir(base,{recursive:true});
 fixture = await fs.mkdtemp(path.join(base,"media-security-")); mocks.root = path.join(fixture,"uploads"); await fs.mkdir(mocks.root);
 vi.spyOn(console,"warn").mockImplementation(()=>{});
});
afterEach(async () => {
 vi.restoreAllMocks();
 // Only remove the exact fixture created by this test, inside this workspace.
 const resolved = path.resolve(fixture);
 if (path.dirname(resolved) !== path.resolve(process.cwd(),".local") || !path.basename(resolved).startsWith("media-security-")) throw Error("Unsafe fixture cleanup");
 await fs.rm(resolved,{recursive:true,force:true,maxRetries:3,retryDelay:50});
});
async function png() { return sharp({create:{width:32,height:24,channels:3,background:"red"}}).png().toBuffer(); }
async function original() { await prepareMediaDirectory(mocks.root,"2026/11"); await fs.writeFile(path.join(mocks.root,"2026/11/photo.png"),"original"); }
const rows = (): unknown[][] => [[{id:BigInt(1)}],[{id:BigInt(1),key:"_wp_attached_file",value:"2026/11/photo.png"}],[]];
describe("media security", () => {
 it("guards direct service reads and writes", async () => {
  mocks.guard.mockRejectedValue(Error("Forbidden")); const t = databaseWith();
  for (const run of [() => uploadMediaFile(Buffer.from("x"),"x.png","image/png",undefined,t.database),()=>deleteMediaItems([1],t.database),()=>getMediaLibraryItems({},t.database),()=>getMediaItemDetails(1,t.database),()=>updateMediaItem(1,{title:"x"})]) await expect(run()).rejects.toThrow("Forbidden");
  expect(t.tx.select).not.toHaveBeenCalled();expect(t.tx.transaction).not.toHaveBeenCalled();expect(await fs.readdir(mocks.root)).toEqual([]);
 });
 it.each(["../outside.png","/outside.png","C:/outside.png","2026/../outside.png","2026/.secret.png","2026/%2e%2e/outside.png","2026/a\\b.png"])("rejects unsafe storage path %s", name => { expect(()=>mediaPathParts(name)).toThrow(); });
 it.each(["html","svg","js","php","css","exe","xml"])("rejects active/unsupported uploads .%s", extension => { expect(()=>validateMediaUpload(`file.${extension}`,"application/octet-stream",Buffer.from("<script>alert(1)</script>"))).toThrow(); });
 it("rejects MIME mismatches, oversized batches and invalid query inputs", async () => {
  const bytes = await png(); expect(()=>validateMediaUpload("a.png","text/html",bytes)).toThrow();
  expect(mediaDeleteIdsSchema.safeParse(Array(101).fill(1)).success).toBe(false);
  expect(mediaDeleteIdsSchema.parse([1,1])).toEqual([1]); expect(mediaListQuerySchema.safeParse({page:Infinity}).success).toBe(false); expect(mediaListQuerySchema.safeParse({month:"2026-13"}).success).toBe(false);
 });
 it("rejects a forged image with correct-looking signature before filesystem writes", async () => {
  const t = databaseWith();await expect(uploadMediaFile(Buffer.from([137,80,78,71,13,10,26,10]),"x.png","image/png",undefined,t.database)).rejects.toThrow("invalid_upload");expect(await fs.readdir(mocks.root)).toEqual([]);expect(t.writes).toEqual([]);
 });
 it("registers normalized raster data and all metadata transactionally under the session identity", async () => {
  const t = databaseWith();const item = await uploadMediaFile(await png(),"photo.png","image/png","forged-author",t.database);
  expect(t.committed()).toBe(true);expect(t.writes[0]).toMatchObject({values:{postAuthor:"editor",postType:"attachment"}});
  expect(item).toMatchObject({id:42,width:32,height:24,mimeType:"image/png",authorName:"Editor"});
  const relative = item.url.slice(9), file = await checkedMediaPath(mocks.root,relative);expect((await sharp(await fs.readFile(file)).metadata()).format).toBe("png");
  expect(JSON.stringify(t.writes[1].values,(_,value)=>typeof value==="bigint"?String(value):value)).toContain('filesize');
 });
 it.each(["webp","gif","avif"] as const)("accepts real %s images and generates valid derivatives", async format => {
  const source=await sharp({create:{width:32,height:24,channels:3,background:"blue"}}).toFormat(format).toBuffer();const t=databaseWith();const item=await uploadMediaFile(source,`photo.${format}`,`image/${format}`,undefined,t.database);
  expect(item).toMatchObject({width:32,height:24,mimeType:`image/${format}`});expect((await sharp(await fs.readFile(await checkedMediaPath(mocks.root,item.url.slice(9)))).metadata()).width).toBe(32);
  expect(await fs.readdir(path.dirname(await checkedMediaPath(mocks.root,item.url.slice(9))))).toHaveLength(format==="webp"?5:9);
 });
 it("does not overwrite original or derivative files for repeated original names", async () => {
  const t = databaseWith(), bytes = await png();const first = await uploadMediaFile(bytes,"photo.png","image/png",undefined,t.database);const second = await uploadMediaFile(bytes,"photo.png","image/png",undefined,t.database);
  expect(first.url).not.toBe(second.url); expect(first.thumbnailUrl).not.toBe(second.thumbnailUrl);
  expect(await fs.readdir(path.dirname(await checkedMediaPath(mocks.root,first.url.slice(9))))).toHaveLength(18);
 });
 it("never overwrites or cleans up an existing collision target", async () => {
  mocks.uuid.mockReturnValue("fixed-id");const now=new Date();const folder=`${now.getUTCFullYear()}/${String(now.getUTCMonth()+1).padStart(2,"0")}`;await prepareMediaDirectory(mocks.root,folder);
  const file=path.join(mocks.root,folder,"photo-fixed-id.png");await fs.writeFile(file,"keep");const t=databaseWith();await expect(uploadMediaFile(await png(),"photo.png","image/png",undefined,t.database)).rejects.toMatchObject({code:"EEXIST"});expect(await fs.readFile(file,"utf8")).toBe("keep");expect(t.writes).toEqual([]);
 });
 it("normalizes image orientation and removes source EXIF", async () => {
  const bytes=await sharp({create:{width:32,height:24,channels:3,background:"red"}}).jpeg().withMetadata({orientation:6}).toBuffer();const t=databaseWith();const item=await uploadMediaFile(bytes,"photo.jpg","image/jpeg",undefined,t.database);
  const metadata=await sharp(await fs.readFile(await checkedMediaPath(mocks.root,item.url.slice(9)))).metadata();expect(metadata.exif).toBeUndefined();expect(item).toMatchObject({width:24,height:32});
 });
 it("removes only newly-created files when attachment metadata registration fails", async () => {
  const t=databaseWith([],2);await fs.writeFile(path.join(mocks.root,"existing.txt"),"keep");await expect(uploadMediaFile(await png(),"photo.png","image/png",undefined,t.database)).rejects.toThrow("DB failure");
  expect(t.committed()).toBe(false);expect(await fs.readFile(path.join(mocks.root,"existing.txt"),"utf8")).toBe("keep");
  const year = path.join(mocks.root,String(new Date().getUTCFullYear()),String(new Date().getUTCMonth()+1).padStart(2,"0"));expect(await fs.readdir(year)).toEqual([]);
 });
 it("never deletes non-attachment metadata or files through a forged ID", async () => {
  await original();const t=databaseWith([[]]);await expect(deleteMediaItems([1],t.database)).rejects.toThrow("details_not_found");expect(t.writes).toEqual([]);expect(t.predicates[0].params).toContain("attachment");expect(await fs.readFile(path.join(mocks.root,"2026/11/photo.png"),"utf8")).toBe("original");
 });
 it("does not unlink anything when a batch contains missing IDs", async () => {
  await original();const t=databaseWith([[{id:BigInt(1)}]]);await expect(deleteMediaItems([1,2],t.database)).rejects.toThrow("details_not_found");expect(t.writes).toEqual([]);expect(await fs.stat(path.join(mocks.root,"2026/11/photo.png"))).toBeTruthy();
 });
 it("deletes only verified attachment records and their files after commit", async () => {
  await original();const t=databaseWith(rows());expect(await deleteMediaItems([1,1],t.database)).toEqual({deletedCount:1});expect(t.committed()).toBe(true);expect(t.writes).toHaveLength(2);expect(t.writes[1].params).toContain("attachment");await expect(fs.stat(path.join(mocks.root,"2026/11/photo.png"))).rejects.toMatchObject({code:"ENOENT"});
 });
 it("preserves an original file shared by another attachment", async () => {
  await original();const data=rows();data[2]=[{file:"2026/11/photo.png"}];const t=databaseWith(data);expect(await deleteMediaItems([1],t.database)).toEqual({deletedCount:1});expect(await fs.readFile(path.join(mocks.root,"2026/11/photo.png"),"utf8")).toBe("original");
 });
 it("does not follow imported traversal metadata outside storage", async () => {
  await fs.writeFile(path.join(fixture,"private.txt"),"secret");const t=databaseWith([[{id:BigInt(1)}],[{id:BigInt(1),key:"_wp_attached_file",value:"../private.txt"}]]);
  expect(await deleteMediaItems([1],t.database)).toEqual({deletedCount:1,cleanupPending:1});expect(await fs.readFile(path.join(fixture,"private.txt"),"utf8")).toBe("secret");
 });
 it("does not remove unrelated files named in forged thumbnail metadata", async () => {
  await original();await fs.writeFile(path.join(mocks.root,"2026/11/unrelated.txt"),"keep");const data=rows();data[1].push({id:BigInt(1),key:"_wp_attachment_metadata",value:JSON.stringify({sizes:{thumbnail:{file:"unrelated.txt"}}})});const t=databaseWith(data);
  expect(await deleteMediaItems([1],t.database)).toEqual({deletedCount:1,cleanupPending:1});expect(await fs.readFile(path.join(mocks.root,"2026/11/unrelated.txt"),"utf8")).toBe("keep");
 });
 it("reports physical cleanup failures without claiming the committed DB delete failed", async () => {
  await original();const t=databaseWith(rows());vi.spyOn(fs,"unlink").mockRejectedValueOnce(Object.assign(Error("denied"),{code:"EACCES"}));expect(await deleteMediaItems([1],t.database)).toEqual({deletedCount:1,cleanupPending:1});expect(t.committed()).toBe(true);expect(await fs.stat(path.join(mocks.root,"2026/11/photo.png"))).toBeTruthy();
 });
 it("rejects storage junction/symlink escapes for both writes and deletes", async context => {
  const outside=path.join(fixture,"outside");await fs.mkdir(outside);await fs.writeFile(path.join(outside,"private.png"),"secret");
  try { await fs.symlink(outside,path.join(mocks.root,"escape"),process.platform==="win32"?"junction":"dir"); } catch(error) { if((error as NodeJS.ErrnoException).code==="EPERM")return context.skip();throw error; }
  await expect(checkedMediaPath(mocks.root,"escape/private.png")).rejects.toThrow("unsafe_path");await expect(prepareMediaDirectory(mocks.root,"escape/new")).rejects.toThrow("unsafe_path");
  const t=databaseWith([[{id:BigInt(1)}],[{id:BigInt(1),key:"_wp_attached_file",value:"escape/private.png"}],[]]);expect(await deleteMediaItems([1],t.database)).toEqual({deletedCount:1,cleanupPending:1});expect(await fs.readFile(path.join(outside,"private.png"),"utf8")).toBe("secret");
 });
});
