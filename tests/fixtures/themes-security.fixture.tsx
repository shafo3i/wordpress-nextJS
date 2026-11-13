
import {createRoot} from "react-dom/client"
import {ThemeDetailsModal} from "../../app/(admin)/admincp/themes/_components/theme-details-modal"
import {ThemeUploadZone} from "../../app/(admin)/admincp/themes/_components/theme-upload-zone"
import en from "../../templates/language/en.json"
const theme={slug:"pressforge-broadsheet",name:"<img src=x onerror=alert(1)>",description:"<script>bad()</script>",author:"<svg onload=alert(1)>",authorUrl:"file:///",tags:"Peace,Peace",version:"1"}
export function render(){createRoot(document.getElementById("fixture")!).render(<><ThemeDetailsModal theme={theme} allThemes={[theme]} onClose={()=>{}} onSelectTheme={()=>{}} dict={en}/><ThemeUploadZone isOpen dict={en}/></>)}
