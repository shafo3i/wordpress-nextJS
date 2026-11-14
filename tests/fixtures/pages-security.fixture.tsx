import {createRoot} from "react-dom/client";
import {PageQuickEditRow} from "../../app/(admin)/admincp/pages/_components/page-quick-edit-row";
import en from "../../templates/language/en.json";
import ar from "../../templates/language/ar.json";
export function render(locale:"en"|"ar") {
 const dict=locale==="ar"?ar:en;
 createRoot(document.getElementById("fixture")!).render(<table><tbody><PageQuickEditRow
 page={{id:"1",title:'<img src=x onerror=alert(1)>',slug:"page",date:"2025-01-02T12:00:00Z",status:"draft",postPassword:"existing-password"}}
 dict={dict} direction={locale==="ar"?"rtl":"ltr"} locale={locale} onCancel={()=>{}} onSuccess={()=>{document.body.dataset.saved="yes";}}/></tbody></table>);
}
