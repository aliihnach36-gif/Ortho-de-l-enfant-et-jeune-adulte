# Regenere js/data.js a partir des fichiers JSON. A lancer depuis la racine : python sources/build.py
import json
NOMS=['1', '2', '3', '4', '5a', '5b', '6', '7', '8', '9', '11a', '11b', '11c', '12', '13', '14', '15', '16', '17', '18']
chs=[json.load(open(f'sources/chapitres/ch{n}.json',encoding='utf8')) for n in NOMS]
ex=json.load(open('sources/extra.json',encoding='utf8'))
merged={}
for c in chs:
    k=c['ch']
    if k in merged:
        for f in ('notions','qcm','errata'): merged[k][f]+=c[f]
    else: merged[k]=c
Nmap={n['id']:c['ch'] for c in merged.values() for n in c['notions']}
for q in ex.pop('moreq',[]): merged[Nmap[q['n']]]['qcm'].append(q)
C=[merged[k] for k in sorted(merged)]
raw=json.dumps({'C':C,'X':ex},ensure_ascii=False).replace('c5-disjonction','c6-disjonction').replace('c5-ancrage','c5-preparation-ancrage').replace('c5-mecaniques','c5-feo-ortho')
D=json.loads(raw)
ids={n['id'] for c in D['C'] for n in c['notions']}
casses=[(n['id'],l) for c in D['C'] for n in c['notions'] for l in n['links'] if l not in ids]
assert not casses,casses
txt='window.DATA='+json.dumps(D,ensure_ascii=False,separators=(',',':')).replace('</','<'+chr(92)+'/')+';'
open('js/data.js','w',encoding='utf8',newline=chr(10)).write(txt+chr(10))
print('notions',len(ids),'qcm',sum(len(c['qcm']) for c in D['C']),'cas',len(D['X']['cases']))
