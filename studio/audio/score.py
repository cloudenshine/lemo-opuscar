"""Generate a deterministic 24-second score for the selected personal style."""
import sys
import json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import numpy as np
import soundfile as sf
from core.audio.pluck import pluck
from core.audio.sfx import SR, compress

out = Path(sys.argv[1])
style = sys.argv[2] if len(sys.argv) > 2 else 'cloud-ink'
events = json.loads(Path(sys.argv[3]).read_text(encoding='utf-8'))['ev'] if len(sys.argv) > 3 else []
if style not in ('cloud-ink', 'chinese-editorial', 'dark-product'):
    raise ValueError('Unknown personal style')
n = int(SR * 24)
mix = np.zeros((n, 2), dtype=np.float64)
rng = np.random.default_rng(37)

def add(audio, at, gain, pan=0):
    start = int(at * SR)
    count = min(len(audio), n - start)
    mix[start:start+count, 0] += audio[:count] * gain * (1 - pan * .35)
    mix[start:start+count, 1] += audio[:count] * gain * (1 + pan * .35)

for at, note, duration, gain in ([(0, 'D3', 5, .55), (4, 'A3', 4, .42), (6.8, 'C4', 4, .34), (9, 'D4', 3, .4), (14, 'G3', 4, .42), (17, 'A4', 4, .38), (20, 'D4', 4, .32)] if style == 'cloud-ink' else []):
    add(pluck('guqin', note, duration, vel=.6, harmonic=at >= 17), at, gain, -.25 if at < 12 else .2)

wind = rng.normal(0, 1, n)
wind = np.convolve(wind, np.ones(140) / 140, mode='same')
if style == 'cloud-ink':
    add(wind, 0, .035)
for at in ([4, 6.8, 14] if style == 'cloud-ink' else []):
    tt = np.arange(int(SR * .65)) / SR
    brush = rng.normal(0, .015, len(tt)) * np.sin(np.pi * tt / .65) ** 2
    add(brush, at, .4, .5)
t = np.arange(int(SR * 1.4)) / SR
drop = np.sin(2 * np.pi * (740 * t - 150 * t * t)) * np.exp(-t * 10) * (1 - np.exp(-t * 100))
if style == 'cloud-ink':
    add(drop, 17, .08, -.2)
else:
    def tone(freq, duration=.4, decay=10):
        tt = np.arange(int(SR * duration)) / SR
        return np.sin(2*np.pi*freq*tt) * np.exp(-tt*decay) * np.clip(tt/.003, 0, 1)
    notes = [220, 261.63, 329.63, 392]
    for beat in range(48):
        at = beat * .5
        add(tone(55 if style == 'dark-product' else 72, .35, 16), at, .045)
        if beat % 2 == 0:
            freq = notes[(beat//2) % 4]
            add(tone(freq, 1, 4) + tone(freq*2.003, 1, 9)*.2, at, .035, .3 if beat%4 else -.3)
    if style == 'dark-product':
        tt = np.arange(n)/SR
        pad = (np.sin(2*np.pi*110*tt) + .3*np.sin(2*np.pi*164.81*tt))*.006
        add(pad, 0, 1)
    for event in events:
        if event['type'] == 'silence':
            continue
        at = float(event['t'])
        if style == 'chinese-editorial':
            tt = np.arange(int(SR * .12))/SR
            click = rng.normal(0, .25, len(tt))*np.exp(-tt*55) + np.sin(2*np.pi*1700*tt)*np.exp(-tt*70)*.15
            add(click, at, .16)
        else:
            add(tone(880 + int(at*8)%4*110, .6, 9), at, .035)
clock = np.arange(n) / SR
envelope = np.clip(clock / .2, 0, 1) * np.clip((24 - clock) / 1.8, 0, 1)
silence_start, silence_end = {'cloud-ink': (12, 14), 'chinese-editorial': (17, 18), 'dark-product': (5, 6)}[style]
envelope *= np.where((clock >= silence_start) & (clock <= silence_end), 0, np.minimum(np.clip((silence_start - clock) / .08, 0, 1) + np.clip((clock - silence_end) / .08, 0, 1), 1))
for channel in range(2):
    mix[:, channel] = compress(mix[:, channel], thr=.018, ratio=3.0, att=.001, rel=.12)
mix *= envelope[:, None]
assert np.isfinite(mix).all()
assert not np.any(mix[int(silence_start * SR):int(silence_end * SR)])
peak = np.max(np.abs(mix))
if peak > .8:
    mix *= .8 / peak
out.parent.mkdir(parents=True, exist_ok=True)
sf.write(out, mix, SR, subtype='PCM_24')
print(f'Score: {style}, 24 s, {SR} Hz, silence {silence_start}–{silence_end} s, peak {np.max(np.abs(mix)):.3f}')
