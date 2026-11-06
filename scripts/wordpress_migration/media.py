"""Resume copying the media library without replacing unrelated destination files."""
import concurrent.futures
import hashlib
import ipaddress
import json
import os
import shutil
import socket
import sys
import urllib.request
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit, quote
from uuid import uuid4
from prepare import ROOT, OUT, UPLOADS, safe_path

DEST=ROOT/'public/uploads'
ALLOWED={'.jpg','.jpeg','.jpe','.png','.gif','.webp','.avif','.bmp','.tif','.tiff','.ico','.pdf','.mp4','.m4v','.mov','.mp3','.m4a','.aac','.wav','.ogg','.ogv','.webm','.flac','.doc','.docx','.xls','.xlsx','.ppt','.pptx','.woff','.woff2'}
HOSTS={'jubrakanews.com','www.jubrakanews.com'}

def checked_url(url):
    parts=urlsplit(url)
    if parts.scheme not in ('http','https') or parts.hostname not in HOSTS or parts.username or parts.password or parts.port not in (None,80,443):raise ValueError('Unapproved media origin')
    for address in socket.getaddrinfo(parts.hostname,parts.port or (443 if parts.scheme=='https' else 80),type=socket.SOCK_STREAM):
        if not ipaddress.ip_address(address[4][0]).is_global:raise ValueError('Non-public media origin')
    return urlunsplit((parts.scheme,parts.netloc,quote(parts.path,safe='/%'),parts.query,''))

class Redirects(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,req,fp,code,msg,headers,newurl):
        return super().redirect_request(req,fp,code,msg,headers,checked_url(newurl))

def target(rel):
    result=DEST/safe_path(rel)
    if not result.resolve().is_relative_to(DEST.resolve()):raise ValueError('Media path escapes storage')
    return result

def digest(path):
    with path.open('rb') as stream:return hashlib.file_digest(stream,'sha256').hexdigest()

def recover(record,prepared):
    rel=record['path'];dest=target(rel)
    if dest.is_file():return {**record,'recovery':'already present'}
    if dest.suffix.lower() not in ALLOWED:return {**record,'recovery':'unsupported media type'}
    dest.parent.mkdir(parents=True,exist_ok=True)
    temp=dest.with_name(dest.name+'.migration-'+uuid4().hex+'.part')
    try:
        request=urllib.request.Request(checked_url(record['url']),headers={'User-Agent':'PressForge-Migration/1.0'})
        with urllib.request.build_opener(Redirects()).open(request,timeout=12) as response:
            if 'text/html' in response.headers.get('Content-Type',''):raise ValueError('HTML response is not media')
            size=0
            with temp.open('wb') as stream:
                while chunk:=response.read(128*1024):
                    size+=len(chunk)
                    if size>64*1024*1024:raise ValueError('Media download exceeds 64 MB')
                    stream.write(chunk)
            if not size:raise ValueError('Empty media download')
        temp.replace(dest)
        return {**record,'recovery':'original downloaded'}
    except Exception as error:
        temp.unlink(missing_ok=True)
        # Preserve the best available archived image when an original is absent.
        keys=prepared['metadata'].get(record['id'],{})
        try:metadata=json.loads(keys.get('_wp_attachment_metadata',['{}'])[0])
        except (ValueError,TypeError):metadata={}
        candidates=[]
        if dest.suffix.lower() in {'.jpg','.jpeg','.png','.gif','.webp','.avif'}:
            for item in (metadata.get('sizes',{}) or {}).values():
                if not isinstance(item,dict) or not item.get('file'):continue
                source=UPLOADS/str(Path(rel).parent/item['file'])
                if source.is_file() and source.resolve().is_relative_to(UPLOADS.resolve()):candidates.append((int(item.get('width',0))*int(item.get('height',0)),source))
        if candidates:
            _,source=max(candidates,key=lambda item:item[0]);shutil.copy2(source,dest)
            return {**record,'recovery':'archived image variant','variant':source.relative_to(UPLOADS).as_posix()}
        return {**record,'recovery':'unresolved','error':type(error).__name__}

def main():
    apply='--copy' in sys.argv
    prepared=json.loads((OUT/'prepared.json').read_text(encoding='utf-8'))
    registered={p.get('_media_path') for p in prepared['posts'] if p['post_type']=='attachment'}
    files=[];skipped=[];total=0
    for base,dirs,names in os.walk(UPLOADS,followlinks=False):
        dirs[:]=[name for name in dirs if not (Path(base)/name).is_symlink()]
        for name in names:
            path=Path(base)/name;rel=path.relative_to(UPLOADS).as_posix()
            if path.is_symlink() or path.suffix.lower() not in ALLOWED or (not rel.split('/')[0].isdigit() and rel not in registered):
                skipped.append(rel);continue
            files.append((path,rel));total+=path.stat().st_size
    print(json.dumps({'copy':apply,'files':len(files),'bytes':total,'excluded_non_media':len(skipped)}),flush=True)
    if not apply:return
    DEST.mkdir(parents=True,exist_ok=True)
    if shutil.disk_usage(DEST).free<total+100_000_000:raise RuntimeError('Insufficient free disk space')
    copied=existing=0
    for index,(source,rel) in enumerate(files,1):
        dest=target(rel);dest.parent.mkdir(parents=True,exist_ok=True)
        if dest.exists():
            if dest.stat().st_size!=source.stat().st_size or digest(dest)!=digest(source):raise RuntimeError('Different file already exists: '+rel)
            existing+=1
        else:shutil.copy2(source,dest);copied+=1
        if index%5000==0:print(json.dumps({'media_processed':index,'total':len(files)}),flush=True)
    missing=json.loads((OUT/'missing-media.json').read_text(encoding='utf-8'))
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:recovered=list(executor.map(lambda row:recover(row,prepared),missing))
    report={'copied':copied,'existing':existing,'excluded_non_media':skipped,'recovery':recovered,'unresolved':sum(r['recovery']=='unresolved' for r in recovered)}
    (OUT/'media-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'copied':copied,'existing':existing,'recovered':len(recovered)-report['unresolved'],'unresolved':report['unresolved']}),flush=True)

if __name__=='__main__':main()
