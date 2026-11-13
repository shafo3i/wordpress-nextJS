
import {test,expect} from "@playwright/test"
import {build} from "esbuild"
import {fileURLToPath} from "node:url"
test("theme metadata is text, file URLs are rejected, activation failures remain visible and ZIP installs are unavailable",async({page})=>{
 const errors:string[]=[]
 page.on("console",message=>{if(message.type()==="error")errors.push(message.text())})
 const result=await build({entryPoints:[fileURLToPath(new URL("./fixtures/themes-security.fixture.tsx",import.meta.url))],bundle:true,write:false,format:"iife",platform:"browser",globalName:"ThemesFixture",plugins:[{name:"theme-fixture",setup(builder){
  builder.onResolve({filter:/^(?:next\/link|\.\.\/actions)$/},args=>({path:args.path,namespace:"theme-fixture"}))
  builder.onLoad({filter:/.*/,namespace:"theme-fixture"},args=>({resolveDir:process.cwd(),contents:args.path==="next/link" ? "import React from 'react';export default function Link({children,...props}){return React.createElement('a',props,children)}" : "export async function activateThemeAction(){return {success:false,error:'admin.themes.activation_error'}}"}))
 }}]})
 await page.setContent('<div id="fixture"></div>')
 await page.addScriptTag({content:result.outputFiles[0].text})
 await page.evaluate(()=>(window as unknown as {ThemesFixture:{render:()=>void}}).ThemesFixture.render())
 await expect(page.locator("#fixture script,#fixture [onerror],#fixture [onload],a[href^='file:']")).toHaveCount(0)
 await expect(page.getByText("<script>bad()</script>",{exact:true})).toBeVisible()
 await expect(page.getByText("Peace",{exact:true})).toHaveCount(1)
 await page.getByRole("button",{name:"Activate",exact:true}).click()
 await expect(page.getByRole("alert")).toHaveText("Unable to activate the theme. Please try again.")
 await expect(page.locator('input[type="file"]')).toHaveCount(0)
 await expect(page.getByText("Theme ZIP uploads are not supported.",{exact:false})).toBeVisible()
 expect(errors.filter(error=>error.includes("same key"))).toEqual([])
})
