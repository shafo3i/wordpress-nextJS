import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
const mocks=vi.hoisted(()=>({rows:[] as unknown[][],predicates:[] as SQL[]}));
vi.mock("server-only",()=>({}));
vi.mock("@/db",()=>({db:{select:()=>{
 const pending=Promise.resolve(mocks.rows.shift()||[]);
 const chain={from:()=>chain,innerJoin:()=>chain,leftJoin:()=>chain,orderBy:()=>chain,limit:()=>chain,
 where:(condition:SQL)=>{mocks.predicates.push(condition);return chain;},then:pending.then.bind(pending)};
 return chain;
}}}));
vi.mock("@/services/language.service",()=>({getDefaultLanguage:async()=>({code:"en"})}));
vi.mock("@/services/media-images.service",()=>({getPostImageAssets:async()=>new Map()}));
vi.mock("@/lib/seo/data",()=>({getPostSeoMap:async()=>new Map()}));
import {getPublishedPageBySlug} from "@/lib/site-content";
beforeEach(()=>{mocks.rows=[];mocks.predicates=[];});
describe("public Pages boundary",()=>{
 it.each(["en","ar"])("sanitizes imported HTML on %s page reads while retaining supported videos",async(locale)=>{
  mocks.rows=[[{id:BigInt(1),title:"Title",slug:"title",content:'<h2>Safe</h2><img src="x" onerror="alert(1)"><script>alert(1)</script><iframe src="https://evil.test/"></iframe><p>https://youtu.be/dQw4w9WgXcQ</p>',date:new Date(),publishedDate:new Date(),modifiedDate:new Date(),locale}],[],[],[]];
  const page=await getPublishedPageBySlug("title",locale);expect(page).not.toBeNull();
  expect(page?.content).toContain("<h2>Safe</h2>");expect(page?.content).not.toMatch(/<script|onerror|evil.test/);expect(page?.content).toContain("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  const predicate=new PgDialect().sqlToQuery(mocks.predicates[0]);expect(predicate.params).toContain("publish");expect(predicate.params).toContain("page");expect(predicate.params).toContain("");expect(predicate.params).toContain(locale);expect(predicate.params).toContain(true);expect(predicate.sql).toContain('"post_date_gmt" <=');
 });
 it("does not offer public preview bypasses when no published row is returned",async()=>{
  expect(await getPublishedPageBySlug("draft","en")).toBeNull();
 });
});
