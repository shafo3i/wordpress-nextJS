import gzip
import json
from pathlib import Path
from collections import defaultdict, Counter
from urllib.parse import unquote
import xml.etree.ElementTree as E
from readers import dump_records

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / ".local/wordpress-migration"
NS = {"wp": "http://wordpress.org/export/1.2/", "content": "http://purl.org/rss/1.0/modules/content/", "excerpt": "http://wordpress.org/export/1.2/excerpt/", "dc": "http://purl.org/dc/elements/1.1/"}

def xml_records(filename):
    result = defaultdict(list)
    with Path(filename).open('rb') as stream:
        if b'<!DOCTYPE' in stream.read(65536).upper(): raise ValueError('DOCTYPE is not permitted')
    for _, el in E.iterparse(filename, events=("end",)):
        if el.tag == "{" + NS['wp'] + "}author":
            result['users'].append({key: el.findtext('wp:'+tag, default='', namespaces=NS) for key,tag in [('ID','author_id'),('user_login','author_login'),('user_email','author_email'),('display_name','author_display_name')]})
        if el.tag != 'item': continue
        row = {key: el.findtext('wp:'+key, default='', namespaces=NS) for key in ['post_date','post_date_gmt','post_modified','post_modified_gmt','post_name','post_parent','menu_order','post_type','post_password','comment_status','ping_status']}
        row.update(ID=el.findtext('wp:post_id',namespaces=NS), post_title=el.findtext('title',default=''), post_content=el.findtext('content:encoded',default='',namespaces=NS), post_excerpt=el.findtext('excerpt:encoded',default='',namespaces=NS), post_status=el.findtext('wp:status',namespaces=NS), guid=el.findtext('guid',default=''), creator=el.findtext('dc:creator',default='',namespaces=NS), attachment_url=el.findtext('wp:attachment_url',default='',namespaces=NS))
        result['posts'].append(row)
        for m in el.findall('wp:postmeta', NS): result['postmeta'].append({'post_id':row['ID'],'meta_key':m.findtext('wp:meta_key',namespaces=NS),'meta_value':m.findtext('wp:meta_value',default='',namespaces=NS)})
        for term in el.findall('category'): result['xml_terms'].append({'post_id':row['ID'],'taxonomy':term.get('domain'),'slug':term.get('nicename') or term.text,'name':term.text or ''})
        for comment in el.findall('wp:comment',NS):
            data={child.tag.rsplit('}',1)[-1]:(child.text or '') for child in comment if child.tag.rsplit('}',1)[-1]!='commentmeta'}
            data['comment_ID']=data.pop('comment_id');data['comment_post_ID']=row['ID'];data['user_id']=data.pop('comment_user_id','0')
            result['comments'].append(data)
        el.clear()
    return dict(result)

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    sources=[]
    for priority, name in enumerate(['jubr-wordpress-dump.sql','jubrakanews_com_42n-2026-10-01-e4fd317.sql'],1):
        datasets=defaultdict(lambda:defaultdict(list))
        for prefix,kind,row in dump_records(ROOT/'docs/jubrakanews/wordpress'/name):
            if kind=='users': row={k:v for k,v in row.items() if k not in ['user_pass','user_activation_key']}
            if kind=='options' and row.get('option_name') not in ['blogname','blogdescription','WPLANG','timezone_string','siteurl','home']: continue
            datasets[prefix][kind].append(row)
        for prefix, dataset in datasets.items():
            if not dataset['posts']: continue
            source=f'sql-{priority}-{prefix.rstrip("_")}'
            path=OUT/(source+'.json.gz')
            with gzip.open(path,'wt',encoding='utf-8') as stream: json.dump(dict(dataset),stream,ensure_ascii=False)
            sources.append({'id':source,'priority':priority,'file':path.name,'tables':{k:len(v) for k,v in dataset.items()},'types':dict(Counter(p['post_type'] for p in dataset['posts']))})
        print(json.dumps({'staged':name},ensure_ascii=False),flush=True)
    dataset=xml_records(ROOT/'docs/WordPress.2026-10-23.xml')
    with gzip.open(OUT/'xml.json.gz','wt',encoding='utf-8') as stream:json.dump(dataset,stream,ensure_ascii=False)
    sources.append({'id':'xml','priority':3,'file':'xml.json.gz','tables':{k:len(v) for k,v in dataset.items()},'types':dict(Counter(p['post_type'] for p in dataset['posts']))})
    xml_posts={p['ID']:unquote(p['post_name']) for p in dataset['posts'] if p['post_type']=='post'}
    for source in sources[:-1]:
        with gzip.open(OUT/source['file'],'rt',encoding='utf-8') as stream:data=json.load(stream)
        posts=[p for p in data['posts'] if p['post_type']=='post']
        source['matching_xml_ids_and_slugs']=sum(xml_posts.get(p['ID'])==unquote(p['post_name']) for p in posts)
        source['same_id_different_slug']=sum(p['ID'] in xml_posts and xml_posts[p['ID']]!=unquote(p['post_name']) for p in posts)
    (OUT/'sources.json').write_text(json.dumps(sources,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(sources,ensure_ascii=False,indent=2))

if __name__=='__main__':main()
