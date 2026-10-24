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
# Round 7: no green or mint box fills in light mode. Hues 95-200 read as pale
# green on the cool grey at this chroma, so no band/surface uses them.
# Forest green stays the brand/action colour (buttons, links, chips, rings).
GREEN_FILL_RANGE = (95, 200)
# Tools: no tint. Neutral fills; forest green only for chip, ink and ring.
TOOLS_NEUTRAL = True
HUES = {  # OKLCH hue (degrees)
  'water': 215, 'food': 15, 'kits': 85, 'power': 305, 'home': 66,
  'docs': 322, 'health': 352, 'skills': 265, 'gov': 240,
}
NEUTRAL_H = 286
out = {}
for area, h in HUES.items():
    assert not (GREEN_FILL_RANGE[0] <= h <= GREEN_FILL_RANGE[1]), f'{area} hue {h} is in the green fill range'
    vals = {}
    for role,(L,C) in ROLE.items():
        hexv, c_used = oklch_to_hex(L, C, h)
        vals[role] = (hexv, L, round(c_used,3), h)
    vals['chip-ink'] = vals['ink']
    out[area] = vals
# Tools: neutral fills, green accents.
fh = 150
out['tools'] = {
  'band': ('#f5f5f7',)+hex_to_oklch('#f5f5f7'), 'surface': ('#ffffff',1,0,0), 'border': ('#e2e3e8',)+hex_to_oklch('#e2e3e8'),
  'strong': (oklch_to_hex(0.560,0.110,fh)[0],0.560,0.11,fh), 'chip': ('#2f5d3a',)+hex_to_oklch('#2f5d3a'),
  'chip-ink': ('#ffffff',1,0,0), 'ink': ('#2f5d3a',)+hex_to_oklch('#2f5d3a'),
}
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
for name,(L,C,h) in {'sand':(0.890,0.012,NEUTRAL_H),'info-bg':(0.955,0.012,250),'warn-bg':(0.950,0.024,50),'ill-water':(0.830,0.045,220)}.items():
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
def hd(a,b): d=abs(HUES[a]-HUES[b])%360; return min(d,360-d)
hp=[]
for r in hero:
    for i in range(3): hp.append((r[i],r[i+1]))
for i in range(4): hp.append((hero[0][i],hero[1][i]))
why=[['power','water','home'],['skills','kits','gov']]
wp=[]
for r in why:
    for i in range(2): wp.append((r[i],r[i+1]))
for i in range(3): wp.append((why[0][i],why[1][i]))
print('hero neighbour hue gaps:', ', '.join(f'{a}-{b} {hd(a,b)}°' for a,b in hp))
print('why-prepare grid gaps:  ', ', '.join(f'{a}-{b} {hd(a,b)}°' for a,b in wp))
bad=[(a,b,hd(a,b)) for a,b in hp+wp if hd(a,b)<37]
print('NEIGHBOURS < 37°:', bad or 'none')
pairs=set()
for r in hero:
    for i in range(3): pairs.add((r[i],r[i+1]))
for i in range(4): pairs.add((hero[0][i],hero[1][i]))
pairs |= {('water','kits'),('kits','power'),('power','home'),('home','skills')}  # Find your topic row
print('\nneighbour ΔE (OKLab) band / border / chip:')
for a,b in sorted(pairs):
    A,B=out[a],out[b]
    print(f"  {a:7}-{b:7} {de(A['band'][0],B['band'][0]):.3f} {de(A['border'][0],B['border'][0]):.3f} {de(A['chip'][0],B['chip'][0]):.3f}")
