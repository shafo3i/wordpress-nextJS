import {test,expect} from "@playwright/test";
import {build} from "esbuild";
import {fileURLToPath} from "node:url";
import {readFileSync} from "node:fs";
const en = JSON.parse(readFileSync(new URL("../templates/language/en.json",import.meta.url),"utf8"));
const ar = JSON.parse(readFileSync(new URL("../templates/language/ar.json",import.meta.url),"utf8"));
for(const locale of ["en","ar"] as const) test(`Pages quick-edit retains failed edits and shows a safe ${locale} error`,async({page})=>{
 const dict=locale==="ar"?ar:en;
 const bundle=await build({entryPoints:[fileURLToPath(new URL("./fixtures/pages-security.fixture.tsx",import.meta.url))],bundle:true,write:false,format:"iife",platform:"browser",globalName:"PagesFixture",plugins:[{name:"mock-pages-action",setup(build){build.onResolve({filter:/^\.\.\/action$/},()=>({path:"pages-action",namespace:"mock"}));build.onLoad({filter:/.*/,namespace:"mock"},()=>({contents:`export async function quickUpdatePageAction(data){window.pagePayload=data;return {success:false,error:${JSON.stringify(dict["admin.pages.error.parent"])}}}` ,loader:"js"}));}}]});
 await page.setContent('<div id="fixture"></div>');await page.addScriptTag({content:bundle.outputFiles[0].text});
 await page.evaluate(locale=>(window as unknown as {PagesFixture:{render:(locale:"en"|"ar")=>void}}).PagesFixture.render(locale),locale);
 await expect(page.locator('input[type="text"]').first()).toHaveValue('<img src=x onerror=alert(1)>');expect(await page.locator("img").count()).toBe(0);
 await page.getByRole("button",{name:dict["admin.common.update"],exact:true}).click();
 await expect(page.getByText(dict["admin.pages.error.parent"],{exact:true})).toBeVisible();
 const payload=await page.evaluate(()=>(window as unknown as {pagePayload:{postPassword:string;status:string}}).pagePayload);
 expect(payload.postPassword).toBe("existing-password");expect(payload.status).toBe("draft");
 await expect(page.locator("body")).not.toHaveAttribute("data-saved","yes");
});
