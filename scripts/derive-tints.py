# Derives the light-mode area tints in OKLCH and checks contrast and separation.
# Usage: python3 scripts/derive-tints.py  (prints hex values and checks; edit ROLE/HUES to adjust)
import json, math
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from oklch import *
# One lightness/chroma per role; areas differ only in hue.
ROLE = {               #  L      C
  'band':    (0.955, 0.020),
  'surface': (0.976, 0.012),
  'border':  (0.860, 0.050),
  'strong':  (0.600, 0.100),   # state ring / accents: must reach 3:1 on surface
  'chip':    (0.910, 0.042),
  'ink':     (0.410, 0.090),
}
# Tools: the green family one step stronger.
TOOLS = {'band':(0.945,0.030),'surface':(0.970,0.018),'border':(0.820,0.070),'strong':(0.560,0.110),'ink':(0.420,0.090)}
HUES = {  # OKLCH hue (degrees)
  'water': 215, 'food': 148, 'kits': 85, 'power': 300, 'home': 50,
  'docs': 322, 'health': 352, 'skills': 118, 'gov': 240, 'tools': 148,
}
NEUTRAL_H = 286
out = {}
for area, h in HUES.items():
    roles = dict(ROLE); 
    if area == 'tools': roles.update(TOOLS)
    vals = {}
    for role,(L,C) in roles.items():
        hexv, c_used = oklch_to_hex(L, C, h)
        vals[role] = (hexv, L, round(c_used,3), h)
    if area == 'tools':
        vals['chip'] = ('#2f5d3a',)+hex_to_oklch('#2f5d3a')
        vals['chip-ink'] = ('#ffffff',1,0,0)
    else:
        vals['chip-ink'] = vals['ink']
    out[area] = vals
# Neutral tone on the same system (cool grey, near-zero chroma)
out['neutral'] = {
  'band': ('#f5f5f7',)+hex_to_oklch('#f5f5f7'), 'surface': ('#ffffff',1,0,0), 'border': ('#e2e3e8',)+hex_to_oklch('#e2e3e8'),
  'strong': ('#858a94',)+hex_to_oklch('#858a94'),
}
for role,(L,C) in [('chip',(0.930,0.008)),('ink',(0.400,0.020))]:
    hx,c=oklch_to_hex(L,C,NEUTRAL_H); out['neutral'][role]=(hx,L,round(c,3),NEUTRAL_H)
out['neutral']['chip-ink']=out['neutral']['ink']
# Utility tints on the same system
util = {}
for name,(L,C,h) in {'sand':(0.890,0.012,NEUTRAL_H),'info-bg':(0.950,0.024,150),'warn-bg':(0.950,0.024,50),'ill-water':(0.830,0.045,220)}.items():
    util[name]=oklch_to_hex(L,C,h)[0]
json.dump({'areas':out,'util':util}, sys.stdout if False else open(os.devnull,'w'))

# ---- checks
text, muted, heading, link = '#23272a', '#5b6069', '#23272a', '#2f5d3a'
bg, nband = '#fbfbfc', '#f5f5f7'
fails=[]; rows=[]
for a,v in out.items():
    band,surf,border,strong,chip,ink,chipink=[v[k][0] for k in ('band','surface','border','strong','chip','ink','chip-ink')]
    checks = {
      'text/band':cr(text,band),'muted/band':cr(muted,band),'link/band':cr(link,band),'ink/band':cr(ink,band),
      'muted/surface':cr(muted,surf),'ink/surface':cr(ink,surf),'ink/white':cr(ink,'#ffffff'),'chip-ink/chip':cr(chipink,chip),
    }
    nontext = {'strong/surface':cr(strong,surf),'strong/band':cr(strong,band),'strong/page':cr(strong,bg)}
    for k,r in checks.items():
        if r<4.5: fails.append((a,k,round(r,2)))
    for k,r in nontext.items():
        if r<3: fails.append((a,k,round(r,2)))
    rows.append((a, v, min(checks.values()), min(nontext.values()), cr(border,surf), de(band,nband)))
print('FAILS:', fails or 'none')
print(f"{'area':8} {'h':>4} band     surface  border   strong   chip     ink      | minText minUI  border/surf  ΔE(band,neutral)")
for a,v,mt,mu,bs,dn in rows:
    print(f"{a:8} {v['band'][3] if a!='neutral' else 286:>4} {v['band'][0]} {v['surface'][0]} {v['border'][0]} {v['strong'][0]} {v['chip'][0]} {v['ink'][0]} | {mt:5.2f}  {mu:5.2f}   {bs:4.2f}        {dn:.3f}")
print('util', util)
# neighbours in hero grid and topic grid
hero=[['water','food','kits','power'],['health','home','docs','gov']]
pairs=set()
for r in hero:
    for i in range(3): pairs.add((r[i],r[i+1]))
for i in range(4): pairs.add((hero[0][i],hero[1][i]))
pairs |= {('water','kits'),('kits','power'),('power','home'),('home','skills')}  # Find your topic row
print('\nneighbour ΔE (OKLab) band / border / chip:')
for a,b in sorted(pairs):
    A,B=out[a],out[b]
    print(f"  {a:7}-{b:7} {de(A['band'][0],B['band'][0]):.3f} {de(A['border'][0],B['border'][0]):.3f} {de(A['chip'][0],B['chip'][0]):.3f}")
