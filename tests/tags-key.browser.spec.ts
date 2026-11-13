
import {test,expect} from "@playwright/test"
import {build} from "esbuild"
import {fileURLToPath} from "node:url"
test("deduplicates imported tag pills, suggestions and Arabic-comma input",async({page})=>{
 const errors:string[]=[]
 page.on("console",message=>{if(message.type()==="error")errors.push(message.text())})
 const bundle=await build({entryPoints:[fileURLToPath(new URL("./fixtures/tags-key.fixture.tsx",import.meta.url))],bundle:true,write:false,format:"iife",platform:"browser",globalName:"TagsFixture"})
 await page.setContent('<div id="fixture"></div>')
 await page.addScriptTag({content:bundle.outputFiles[0].text})
 await page.evaluate(()=>(window as unknown as {TagsFixture:{render:()=>void}}).TagsFixture.render())
 await expect(page.locator('button[aria-label]')).toHaveCount(1)
 await expect(page.getByRole("button",{name:"Peace",exact:true})).toHaveCount(1)
 await page.getByPlaceholder("Add tag").fill("Peace\u060cPeace")
 await page.getByRole("button",{name:"Add",exact:true}).click()
 await expect(page.locator('button[aria-label]')).toHaveCount(2)
 await page.locator('button[aria-label]').first().click()
 await expect(page.locator('button[aria-label]')).toHaveCount(1)
 expect(errors.filter(error=>error.includes("same key"))).toEqual([])
})
