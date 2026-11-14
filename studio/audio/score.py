"""Generate the original 24-second Cloud & Ink score using the upstream guqin model."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import numpy as np
import soundfile as sf
from core.audio.pluck import pluck
from core.audio.sfx import SR, compress

out = Path(sys.argv[1])
n = int(SR * 24)
mix = np.zeros((n, 2), dtype=np.float64)
rng = np.random.default_rng(37)

def add(audio, at, gain, pan=0):
    start = int(at * SR)
    count = min(len(audio), n - start)
    mix[start:start+count, 0] += audio[:count] * gain * (1 - pan * .35)
    mix[start:start+count, 1] += audio[:count] * gain * (1 + pan * .35)

for at, note, duration, gain in [(0, 'D3', 5, .55), (4, 'A3', 4, .42), (6.8, 'C4', 4, .34), (9, 'D4', 3, .4), (14, 'G3', 4, .42), (17, 'A4', 4, .38), (20, 'D4', 4, .32)]:
    add(pluck('guqin', note, duration, vel=.6, harmonic=at >= 17), at, gain, -.25 if at < 12 else .2)

wind = rng.normal(0, 1, n)
wind = np.convolve(wind, np.ones(140) / 140, mode='same')
add(wind, 0, .035)
for at in [4, 6.8, 14]:
    tt = np.arange(int(SR * .65)) / SR
    brush = rng.normal(0, .015, len(tt)) * np.sin(np.pi * tt / .65) ** 2
    add(brush, at, .4, .5)
t = np.arange(int(SR * 1.4)) / SR
drop = np.sin(2 * np.pi * (740 * t - 150 * t * t)) * np.exp(-t * 10) * (1 - np.exp(-t * 100))
add(drop, 17, .08, -.2)
clock = np.arange(n) / SR
envelope = np.clip(clock / .2, 0, 1) * np.clip((24 - clock) / 1.8, 0, 1)
envelope *= np.where((clock >= 12) & (clock <= 14), 0, np.minimum(np.clip((12 - clock) / .08, 0, 1) + np.clip((clock - 14) / .08, 0, 1), 1))
for channel in range(2):
    mix[:, channel] = compress(mix[:, channel], thr=.018, ratio=3.0, att=.001, rel=.12)
mix *= envelope[:, None]
assert np.isfinite(mix).all()
assert not np.any(mix[int(12 * SR):int(14 * SR)])
peak = np.max(np.abs(mix))
if peak > .8:
    mix *= .8 / peak
out.parent.mkdir(parents=True, exist_ok=True)
sf.write(out, mix, SR, subtype='PCM_24')
print(f'Score: 24 s, {SR} Hz, literal silence 12–14 s, peak {np.max(np.abs(mix)):.3f}')
