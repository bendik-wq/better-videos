import json,csv,glob,os,sys,datetime
S='/tmp/claude-0/-home-user-better-videos/79ab24ef-785f-53ed-8c76-d7f9915739fd/scratchpad'
OUT='/home/user/better-videos/docs/library/animation-study/data'
os.makedirs(OUT,exist_ok=True)
def flat(d):
    out=[]
    for x in d.get('entries',[]) or []:
        if not x: continue
        if x.get('entries'): out+=[y for y in x['entries'] if y]
        else: out.append(x)
    return out
def load(p):
    try: return json.load(open(p))
    except Exception: return None
srcs={}
for p in glob.glob(S+'/meta/*.json'):
    b=os.path.basename(p)[:-5]
    if b in('err',): continue
    srcs[b]=p
for p in glob.glob(S+'/p2/*.json'):
    b=os.path.basename(p)[:-5]
    if b.startswith('dates_'): continue
    srcs[b]=p
rows_all=[];chan=[]
for b,p in sorted(srcs.items()):
    d=load(p)
    if not d or not isinstance(d,dict): continue
    e=flat(d)
    if not e: continue
    tab='shorts' if b.endswith('.shorts') else 'videos'
    handle=b.replace('.shorts','').replace('kurz','kurzgesagt') if b.startswith('kurz') else b.replace('.shorts','')
    if handle=='kurzgesagtgesagt': handle='kurzgesagt'
    fn=f"{OUT}/{handle}.{tab}.csv"
    with open(fn,'w',newline='') as f:
        w=csv.writer(f); w.writerow(['position_newest_first','id','title','view_count','duration_s'])
        for i,x in enumerate(e):
            w.writerow([i,x.get('id'),x.get('title'),x.get('view_count'),x.get('duration')])
    chan.append((handle,tab,len(e),d.get('channel_follower_count')))
# dates
for p in glob.glob(S+'/p2/dates_*.json'):
    h=os.path.basename(p)[6:-5]; d=load(p)
    if not d: continue
    e=flat(d)
    with open(f"{OUT}/{h}.newest60.approx-dates.csv",'w',newline='') as f:
        w=csv.writer(f); w.writerow(['position_newest_first','id','title','view_count','duration_s','approx_upload_date'])
        for i,x in enumerate(e):
            ts=x.get('timestamp'); dt=datetime.datetime.utcfromtimestamp(ts).date().isoformat() if ts else ''
            w.writerow([i,x.get('id'),x.get('title'),x.get('view_count'),x.get('duration'),dt])
for h in ['JaredOwen','Animagraffs']:
    d=load(S+f'/p2/{h}.json'); e=flat(d)
    with open(f"{OUT}/{h}.newest60.approx-dates.csv",'w',newline='') as f:
        w=csv.writer(f); w.writerow(['position_newest_first','id','title','view_count','duration_s','approx_upload_date'])
        for i,x in enumerate(e[:60]):
            ts=x.get('timestamp'); dt=datetime.datetime.utcfromtimestamp(ts).date().isoformat() if ts else ''
            w.writerow([i,x.get('id'),x.get('title'),x.get('view_count'),x.get('duration'),dt])
with open(OUT+'/channels.csv','w',newline='') as f:
    w=csv.writer(f); w.writerow(['handle','tab','videos','subscribers'])
    for c in sorted(chan): w.writerow(c)
print(*sorted(chan),sep='\n')
