import csv,glob,os,statistics as st,re,datetime
D='/home/user/better-videos/docs/library/animation-study/data'
def rd(p): return list(csv.DictReader(open(p)))
def v(r): return int(r['view_count'] or 0)
def dur(r): return float(r['duration_s'] or 0)
def fm(n): return f"{n/1e6:.1f}M" if n>=1e6 else f"{n/1e3:.0f}K"
def mmss(s): s=int(s); return f"{s//60}:{s%60:02d}"
import sys
mode=sys.argv[1]
if mode=='top':
    for p in sorted(glob.glob(D+'/*.videos.csv'))+sorted(glob.glob(D+'/*.shorts.csv')):
        R=rd(p); 
        if not R: continue
        print(f"\n## {os.path.basename(p)} n={len(R)} median={fm(st.median([v(r) for r in R]))}")
        for r in sorted(R,key=lambda r:-v(r))[:10]: print(f"| {fm(v(r))} | {mmss(dur(r))} | {r['title']} |")
if mode=='recent':
    cut=datetime.date(2025,11,5)
    for p in sorted(glob.glob(D+'/*.approx-dates.csv')):
        R=rd(p); W=[r for r in R if r['approx_upload_date'] and datetime.date.fromisoformat(r['approx_upload_date'])>cut + datetime.timedelta(days=2)]
        h=os.path.basename(p).split('.')[0]
        oldest=R[-1]['approx_upload_date'] if R else ''
        if not W: print(f"\n## {h}: 0 uploads in window (newest {R[0]['approx_upload_date'] if R else ''})"); continue
        m=st.median([v(r) for r in W])
        print(f"\n## {h}: {len(W)} uploads strictly <12 months old (N months or weeks ago) ; window median {fm(m)} ; median len {mmss(st.median([dur(r) for r in W]))}")
        for r in sorted(W,key=lambda r:-v(r)):
            if v(r)>=2*m: print(f"| {fm(v(r))} | {v(r)/m:.1f}x | {mmss(dur(r))} | ~{r['approx_upload_date'][:7]} | {r['title']} |")
if mode=='runtime':
    B=[(0,4),(4,8),(8,12),(12,20),(20,30),(30,999)]
    def bk(m):
        for a,b in B:
            if a<=m<b: return f"{a}-{b if b<999 else '+'}"
    groups={'history':['OverSimplified','SimpleHistory','KingsandGenerals','TheArmchairHistorian','EpicHistoryTV','HistoryMatters','AlternateHistoryHub','SamONellaAcademy'],
            'science':['kurzgesagt','TEDEd','MinuteEarth','minutephysics','melodysheep','WhatIfScienceShow','SciencephiletheAI','AsapSCIENCE','PrimerBlobs','CGPGrey','Ridddle','JaredOwen','Animagraffs'],
            'infographics':['TheInfographicsShow']}
    for era in ['all','newest100']:
      print(f"\n### era={era}  (cell = median of views/channel-median ; n)")
      for g,hs in groups.items():
        agg={}
        print(f"\n{g}")
        for h in hs:
            p=f"{D}/{h}.videos.csv"
            if not os.path.exists(p): continue
            R=rd(p); R=[r for r in R if dur(r)>=61]
            if era=='newest100': R=R[:100]
            if len(R)<5: continue
            m=st.median([v(r) for r in R]) or 1
            cells={}
            for r in R: cells.setdefault(bk(dur(r)/60),[]).append(v(r)/m); agg.setdefault(bk(dur(r)/60),[]).append(v(r)/m)
            print(f"  {h:22s}"+" ".join(f"{k}:{st.median(c):.2f}({len(c)})" for k,c in sorted(cells.items(),key=lambda x:float(x[0].split('-')[0]))))
        print("  POOLED                "+" ".join(f"{k}:{st.median(c):.2f}({len(c)})" for k,c in sorted(agg.items(),key=lambda x:float(x[0].split('-')[0]))))
if mode=='topic':
    cats={'war/battle/military':r'\b(war|ww1|ww2|battle|army|invasion|soldier|military|nuke|nuclear|bomb|weapon|d-day|empire|siege)\b',
          'famous person':r'\b(napoleon|hitler|stalin|caesar|alexander|genghis|churchill|lincoln|henry viii|cleopatra|kennedy|jfk|einstein|tesla|elon|trump)\b',
          'disaster/accident':r'\b(disaster|titanic|chernobyl|crash|sank|sinking|explosion|collapse|fire|tsunami|earthquake|volcano|eruption|plague|pandemic|accident|meltdown)\b',
          'space/universe':r'\b(universe|black hole|star|sun|planet|galaxy|space|moon|mars|asteroid|alien)\b',
          'body/health/drugs':r'\b(body|brain|immune|cancer|virus|bacteria|drug|sleep|blood|heart|teeth|fentanyl|weed|alcohol|disease)\b',
          'money/brand/company':r'(\$|\b(money|company|brand|billion|million|dollar|bank|rich|economy|mcdonald|pepsi|coca|apple|amazon|toyota)\b)',
          'what-if/hypothetical':r'^(what if|what would happen)|\bwhat if\b',
          'how it works/engineering':r'\b(how (does|do|a|an|the)|works|engine|inside|machine|explained)\b'}
    groups=[('history',['OverSimplified','SimpleHistory','KingsandGenerals','TheArmchairHistorian','EpicHistoryTV','HistoryMatters','AlternateHistoryHub','SamONellaAcademy']),
            ('all long-form',None)]
    for g,hs in groups:
        agg={}
        files=[f"{D}/{h}.videos.csv" for h in hs] if hs else glob.glob(D+'/*.videos.csv')
        for p in files:
            if not os.path.exists(p): continue
            R=[r for r in rd(p) if dur(r)>=61]
            if len(R)<10: continue
            m=st.median([v(r) for r in R]) or 1
            for r in R:
                t=r['title'].lower(); hit=False
                for c,rx in cats.items():
                    if re.search(rx,t): agg.setdefault(c,[]).append(v(r)/m); hit=True
                if not hit: agg.setdefault('(none of these)',[]).append(v(r)/m)
        print(f"\n{g}")
        for c,x in sorted(agg.items(),key=lambda x:-st.median(x[1])): print(f"| {c} | {len(x)} | {st.median(x):.2f}x | {sum(1 for y in x if y>=3)/len(x)*100:.0f}% |")
