
import {createRoot} from "react-dom/client"
import {useState} from "react"
import {MetaBoxTags} from "../../components/admin/posts/editor/meta-box-tags"
import en from "../../templates/language/en.json"
function Fixture(){const [tags,setTags]=useState(["\u0627\u0644\u0633\u0644\u0627\u0645","\u0627\u0644\u0633\u0644\u0627\u0645"]);return <MetaBoxTags tags={tags} onTagsChange={setTags} availableTags={[{slug:"peace",name:"Peace"},{slug:"peace",name:"Peace"}]} dict={en}/>}
export function render(){createRoot(document.getElementById("fixture")!).render(<Fixture/>)}
