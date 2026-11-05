import re,html,sys,csv,subprocess,json
slug,dur=sys.argv[1],float(sys.argv[2])
t=open(sys.argv[3],errors='ignore').read()
i=t.find('Show full transcript')
body=t[i:]; j=body.find('</div>',200)
m=re.search(r'Show full transcript.*?</[^>]+>(.*?)</div>',t,re.S)
txt=html.unescape(re.sub(r'<[^>]+>',' ',m.group(1))); txt=re.sub(r'\s+',' ',txt).strip()
W=txt.split(); N=len(W)
# anchors: quotes linked with ?t=
anc=[]
for mm in re.finditer(r'href="[^"]*\?t=(\d+)[^"]*"[^>]*>(.*?)</a>',t,re.S):
    q=re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',mm.group(2)))).strip().strip('"“”')
    if len(q.split())>=6:
        k=txt.find(' '.join(q.split()[:6]))
        if k>=0: anc.append((int(mm.group(1)), len(txt[:k].split()), q[:60]))
rate=N/dur
print(f"## {slug}: {N} words, runtime {dur:.0f}s -> {rate*60:.0f} wpm of runtime")
for a in anc[:6]: print(f"  anchor ?t={a[0]}s at word {a[1]} (interp {a[1]/rate:.0f}s): {a[2]}")
# sentences of first ~70s
acc=0;out=[]
segs=[]
for s in re.split(r'(?<=[.!?])\s+',txt):
    ws=s.split()
    segs+= [' '.join(ws[i:i+14]) for i in range(0,len(ws),14)] if len(ws)>40 else [s]
for s in segs:
    w=len(s.split()); est=acc/rate
    if est>75: break
    out.append(f"  ~{est:4.1f}s  {s}"); acc+=w
print('\n'.join(out))
