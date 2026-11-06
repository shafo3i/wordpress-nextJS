"""Compile the news site's snapshots; retain all article/attachment IDs, newest wins."""
import gzip
import json
import mimetypes
import re
from collections import defaultdict, Counter
from pathlib import Path, PurePosixPath
from urllib.parse import unquote, urlsplit
from readers import php_value
from stage import ROOT, OUT

UPLOADS = ROOT/'docs/jubrakanews/wordpress/wp-content/uploads'

def load(name):
    with gzip.open(OUT/name,'rt',encoding='utf-8') as stream:return json.load(stream)

def safe_path(value):
    value=(value or '').replace('\\','/')
    if '/wp-content/uploads/' in value:value=value.split('/wp-content/uploads/',1)[1]
    elif value.startswith('wp-content/uploads/'):value=value[len('wp-content/uploads/'):]
    if not value or PurePosixPath(value).is_absolute() or any(p in ('..','.') for p in value.split('/')) or ':' in value or '\0' in value:
        raise ValueError('Unsafe attachment path')
    return value

def clean_date(value, fallback='1970-01-01 00:00:00'):
    return value if value and re.match(r'^[12]\d{3}-\d\d-\d\d [\d:]{8}$',value) else fallback

def main():
    sources=json.loads((OUT/'sources.json').read_text(encoding='utf-8'))
    selected=[s for s in sources if s['id']=='xml' or s.get('matching_xml_ids_and_slugs',0)>100]
    if len(selected)<3:raise ValueError('Expected both news SQL snapshots and XML; refusing incomplete migration')
    posts={}; users={}; terms={}; tax={}; meta=defaultdict(dict); relations=defaultdict(set); comments={}; options={}; original_types=Counter()
    source_report=[]
    for source in selected:
        data=load(source['file']);is_xml=source['id']=='xml'
        for row in data.get('users',[]):users[row['ID']]={**users.get(row['ID'],{}),**row}
        for row in data.get('posts',[]):
            posts[row['ID']]={**posts.get(row['ID'],{}),**row,'_source':source['id']}
            if is_xml:relations[row['ID']]=set()
        by_key=defaultdict(lambda:defaultdict(list))
        for row in data.get('postmeta',[]):by_key[row['post_id']][row['meta_key']].append(row['meta_value'] or '')
        for pid,keys in by_key.items():meta[pid].update(keys)
        for row in data.get('terms',[]):
            row['slug']=unquote(row['slug']);terms[row['term_id']]=row
        for row in data.get('term_taxonomy',[]):tax[row['term_taxonomy_id']]=row
        if not is_xml:
            for pid in {r['object_id'] for r in data.get('term_relationships',[])}:relations[pid]=set()
            for row in data.get('term_relationships',[]):relations[row['object_id']].add(row['term_taxonomy_id'])
        else:
            lookup={(r['taxonomy'],terms[r['term_id']]['slug']):tid for tid,r in tax.items() if r['term_id'] in terms}
            next_term=max(map(int,terms),default=0)+1;next_tax=max(map(int,tax),default=0)+1
            for row in data['xml_terms']:
                if row['taxonomy'] not in ['category','post_tag','post_format']:continue
                slug=unquote(row['slug']);key=(row['taxonomy'],slug);tid=lookup.get(key)
                if not tid:
                    term=str(next_term);next_term+=1;tid=str(next_tax);next_tax+=1
                    terms[term]={'term_id':term,'name':row['name'],'slug':slug,'term_group':'0'}
                    tax[tid]={'term_taxonomy_id':tid,'term_id':term,'taxonomy':row['taxonomy'],'description':'','parent':'0','count':'0'};lookup[key]=tid
                else:terms[tax[tid]['term_id']]['name']=row['name']
                relations[row['post_id']].add(tid)
        for row in data.get('comments',[]):comments[row['comment_ID']]=row
        for row in data.get('options',[]):options[row['option_name']]=row['option_value']
        source_report.append({'source':source['id'],'records':source['types']})
    original_types.update(p['post_type'] for p in posts.values())
    posts={pid:p for pid,p in posts.items() if p['post_type'] in ['post','attachment']}
    tax={tid:t for tid,t in tax.items() if t['taxonomy'] in ['category','post_tag','post_format']}
    wanted_terms={t['term_id'] for t in tax.values()};terms={tid:t for tid,t in terms.items() if tid in wanted_terms}
    meta={pid:keys for pid,keys in meta.items() if pid in posts}
    relations={pid:sorted(tids&tax.keys(),key=int) for pid,tids in relations.items() if pid in posts}
    by_login={u.get('user_login'):uid for uid,u in users.items()}
    missing=[];unsafe=[];converted=0;conflicts=[];protected=[];language=Counter()
    for pid,p in posts.items():
        keys=meta.setdefault(pid,{})
        p['post_author']=by_login.get(p.get('creator')) or p.get('post_author') or next(iter(users))
        p['post_name']=unquote(p.get('post_name') or f'wordpress-{pid}')
        # The source site declares Arabic. Do not create artificial translations.
        p['_locale']='ar';language[p['_locale']]+=1
        p['post_date']=clean_date(p.get('post_date'),clean_date(p.get('post_date_gmt')))
        p['post_date_gmt']=clean_date(p.get('post_date_gmt'),p['post_date'])
        p['post_modified']=clean_date(p.get('post_modified'),p['post_date'])
        p['post_modified_gmt']=clean_date(p.get('post_modified_gmt'),p['post_date_gmt'])
        if p.get('post_password') and p['post_status']=='publish':
            keys['_wordpress_original_status']=['publish'];p['post_status']='private';protected.append(pid)
        for key in ['_thumbnail_id','_wp_attached_file','_wp_attachment_metadata']:
            values=keys.get(key,[])
            if len(set(values))>1:conflicts.append({'post_id':pid,'key':key,'resolution':'first value, matching WordPress single-meta semantics'})
            if values:
                if len(values)>1:keys['_wordpress_original_'+key]=[json.dumps(values,ensure_ascii=False)]
                keys[key]=[values[0]]
        if '_wp_attachment_metadata' in keys:
            raw=keys['_wp_attachment_metadata'][0]
            try:
                parsed=json.loads(raw) if raw.startswith('{') else php_value(raw)
                keys['_wordpress_original_attachment_metadata']=[raw]
                keys['_wp_attachment_metadata']=[json.dumps(parsed,ensure_ascii=False)];converted+=1
            except (ValueError,KeyError,IndexError,UnicodeError):unsafe.append({'post_id':pid,'reason':'unparsed attachment metadata'})
        for old,new in [('_yoast_wpseo_title','_seo_title'),('_yoast_wpseo_metadesc','_seo_description'),('_yoast_wpseo_opengraph-image','_seo_og_image')]:
            if old in keys and new not in keys:keys[new]=keys[old]
        if keys.get('_yoast_wpseo_meta-robots-noindex')==['1']:keys['_seo_noindex']=['1']
        if p['post_type']=='attachment':
            raw=keys.get('_wp_attached_file',[''])[0]
            if not raw:
                url=p.get('attachment_url') or p.get('guid','')
                raw=urlsplit(url).path.split('/wp-content/uploads/',1)[-1]
            try:
                rel=safe_path(raw);p['_media_path']=rel;keys['_wp_attached_file']=[rel]
                p['post_mime_type']=p.get('post_mime_type') or mimetypes.guess_type(rel)[0] or 'application/octet-stream'
                p['_original_media_url']=p.get('attachment_url') or p.get('guid','')
                if (UPLOADS/rel).is_file():
                    keys['_wordpress_original_guid']=[p.get('guid','')];p['guid']='/uploads/'+rel
                else:missing.append({'id':pid,'path':rel,'url':p['_original_media_url']})
            except ValueError:unsafe.append({'post_id':pid,'reason':'unsafe attachment path'})
    comments={cid:c for cid,c in comments.items() if c.get('comment_post_ID') in posts}
    prepared={'posts':list(posts.values()),'users':list(users.values()),'terms':list(terms.values()),'taxonomies':list(tax.values()),'relationships':relations,'metadata':meta,'comments':list(comments.values()),'options':options}
    (OUT/'prepared.json').write_text(json.dumps(prepared,ensure_ascii=False),encoding='utf-8')
    report={'sources':source_report,'excluded_sources':[s['id'] for s in sources if s not in selected], 'posts':dict(Counter(p['post_type'] for p in posts.values())), 'post_statuses':dict(Counter(p['post_status'] for p in posts.values() if p['post_type']=='post')), 'taxonomies':dict(Counter(t['taxonomy'] for t in tax.values())), 'authors':len(users),'comments':len(comments),'decoded_attachment_metadata':converted,'missing_original_files':len(missing),'unsafe_metadata':unsafe,'conflicting_single_meta':conflicts,'password_protected_posts_kept_private':protected,'excluded_types':{k:v for k,v in original_types.items() if k not in ['post','attachment']},'source_language':'ar'}
    (OUT/'missing-media.json').write_text(json.dumps(missing,ensure_ascii=False,indent=2),encoding='utf-8')
    (OUT/'preflight.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(report,ensure_ascii=True,indent=2))

if __name__=='__main__':main()
