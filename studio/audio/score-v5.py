"""Four deterministic buses with picture cues and post-reverb silence."""
import sys
import json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt
from scipy.ndimage import maximum_filter1d, gaussian_filter1d
from core.audio.pluck import pluck
from core.audio.sfx import SR

out = Path(sys.argv[1])
style = sys.argv[2] if len(sys.argv) > 2 else 'cloud-ink'
events = json.loads(Path(sys.argv[3]).read_text(encoding='utf-8'))['ev'] if len(sys.argv) > 3 else []
silences = {'cloud-ink': [(3.5, 4), (12, 14)], 'chinese-editorial': [(5.5, 6), (17, 18)], 'dark-product': [(5, 6), (17.25, 18)]}
if style not in silences: raise ValueError('Unknown personal style')
for event in events:
    at = float(event['t'])
    if not np.isfinite(at) or not 0 <= at < 24 or abs(at*24-round(at*24)) > 1e-7:
        raise ValueError('Sound cues must be finite, inside the film and on whole frames')
n = int(SR*24)
clock = np.arange(n)/SR
rng = np.random.default_rng(37)
buses = {name: np.zeros((n, 2), dtype=np.float64) for name in ['music', 'ambience', 'foley', 'transitions']}

def add(bus, audio, at, gain, pan=0):
    start = round(at*SR)
    count = min(len(audio), n-start)
    if start < 0 or count <= 0: return
    angle = (np.clip(pan, -1, 1)+1)*np.pi/4
    buses[bus][start:start+count, 0] += audio[:count]*gain*np.cos(angle)
    buses[bus][start:start+count, 1] += audio[:count]*gain*np.sin(angle)

def tone(freq, duration=.5, decay=8, harmonic=.15):
    t = np.arange(round(SR*duration))/SR
    return (np.sin(2*np.pi*freq*t)+harmonic*np.sin(2*np.pi*freq*2.003*t))*np.exp(-decay*t)*np.clip(t/.006, 0, 1)*np.clip((duration-t)/.05, 0, 1)

def noise(duration, low, high):
    return sosfilt(butter(2, [low, high], fs=SR, btype='bandpass', output='sos'), rng.normal(0, 1, round(SR*duration)))

def sweep(duration, low=400, high=4000):
    t = np.arange(round(SR*duration))/SR
    return noise(duration, low, high)*np.sin(np.pi*t/duration)**2

def impact(freq, duration=.4):
    t = np.arange(round(SR*duration))/SR
    phase = 2*np.pi*(freq*t+freq*.5*(1-np.exp(-t*25))/25)
    return np.sin(phase)*np.exp(-t*18)*np.clip(t/.002, 0, 1)

if style == 'cloud-ink':
    for at, note, duration, gain in [(0, 'D3', 4, .42), (4, 'A3', 4, .36), (7.75, 'C4', 3, .28), (9.5, 'D4', 3, .3), (14, 'G3', 3, .28), (17, 'A4', 4, .24), (20.5, 'D4', 3.5, .25)]:
        add('music', pluck('guqin', note, duration, vel=.6, harmonic=at >= 17), at, gain, -.3 if at < 12 else .3)
    for at, freq, duration in [(5.5, 293.66, 2), (9, 349.23, 2.5), (18, 440, 2.5), (20.5, 293.66, 3)]:
        t = np.arange(round(SR*duration))/SR
        flute = (np.sin(2*np.pi*freq*t+.035*np.sin(2*np.pi*4.8*t))+.16*np.sin(2*np.pi*freq*2*t))*np.sin(np.pi*t/duration)**2
        add('music', flute, at, .018, -.45)
    add('ambience', noise(24, 120, 1800)*(.7+.3*np.sin(clock*.6)), 0, .009, -.5)
    add('ambience', noise(7, 400, 2800), 17, .0025, .45)
    for at in [7.75, 19.75]: add('transitions', sweep(.9, 250, 2400), at, .022, -.25)
elif style == 'chinese-editorial':
    for beat in range(48):
        at = beat*.5
        if 12 <= at < 18:
            if beat % 4 == 0: add('music', tone(110, .5, 9), at, .026)
            continue
        add('music', impact(65), at, .034 if at < 6 else .055 if at < 12 else .04)
        if beat % 2:
            tt = np.arange(round(SR*.13))/SR
            add('music', noise(.13, 1800, 8500)*np.exp(-tt*45), at, .012, .3)
        if beat % 4 == 2: add('music', tone(146.83, .25, 15, .6), at, .03, -.2)
        if beat % 2 == 0:
            notes = [220, 293.66, 329.63, 440] if at < 12 else [293.66, 369.99, 440, 587.33]
            add('music', tone(notes[(beat//2) % 4], 1.2, 3.5), at, .027, -.4 if beat % 4 else .4)
    add('ambience', noise(24, 150, 750)*(.5+.5*np.sin(clock*.7)**2), 0, .002)
    for at in [11.75, 20.25]: add('transitions', sweep(.75, 600, 6200), at, .02, -.3)
else:
    for section, frequencies in [(0, [110, 164.81, 220]), (6, [130.81, 196, 261.63]), (12, [146.83, 220, 293.66]), (18, [146.83, 185, 220])]:
        t = np.arange(round(SR*6))/SR
        env = np.minimum(np.clip(t/.8, 0, 1), np.clip((6-t)/1.2, 0, 1))
        pad = sum(np.sin(2*np.pi*f*t+.015*np.sin(2*np.pi*.25*t)) for f in frequencies)*env/3
        add('music', pad, section, .018 if section == 12 else .032, -.15)
    for beat in range(48):
        at = beat*.5
        if 12 <= at < 18: continue
        if beat % 2 == 0: add('music', impact(48, .5), at, .055 if at < 12 else .04)
        if at < 5 or 6 <= at < 11 or at >= 18:
            notes = [440, 523.25, 659.25, 783.99] if at < 12 else [587.33, 739.99, 880, 1174.66]
            add('music', tone(notes[beat % 4], .8, 5), at+.125, .018, -.5 if beat % 2 else .5)
    add('ambience', noise(24, 90, 400)*(.4+.6*np.sin(clock*.4)**2), 0, .003)
    for at in [11.75, 18]: add('transitions', sweep(1.2, 150, 3200), at, .03, .3)

for i, event in enumerate(sorted(events, key=lambda e: e['t'])):
    at, kind = float(event['t']), event['type']
    if kind in ['silence', 'air', 'sweep']: continue
    pan = [-.55, -.2, .2, .55][i % 4]
    if style == 'cloud-ink':
        if kind in ['brush', 'leaves', 'wind', 'fall']: add('foley', sweep(.7 if kind == 'brush' else 1, 300, 4200), at, .045 if kind == 'brush' else .026, pan)
        elif kind in ['water', 'ripple']:
            add('foley', tone(740 if kind == 'water' else 980, .8, 12), at, .09 if kind == 'water' else .025, -.15)
            add('foley', sweep(.3, 1100, 5500), at, .018)
        elif kind == 'hop': add('foley', sweep(.22, 500, 3800), at, .06, .25)
        elif kind in ['landing', 'landing-second']: add('foley', impact(280, .2), at, .055, -.25 if kind == 'landing-second' else .3)
        elif kind in ['chirp', 'answer']:
            tt = np.arange(round(SR*.45))/SR
            chirp = np.sin(2*np.pi*((2800*tt-600*tt**2) if kind == 'answer' else (2100*tt+900*tt**2))) * np.sin(np.pi*tt/.45)**4
            add('foley', chirp, at, .035, -.35 if kind == 'answer' else .3)
        elif kind in ['wings', 'follow-wings']:
            for k in range(5): add('foley', sweep(.18, 350, 3300), at+k*.25, .06*(1-k*.13), (-.1+k*.2) if kind == 'follow-wings' else (.3-k*.2))
        elif kind == 'harmonic': add('foley', tone(1174.66, 2, 2), at, .012, .4)
    elif style == 'chinese-editorial':
        if kind == 'type-impact': add('foley', impact(70, .45), at, .15)
        elif kind == 'type-flip': add('transitions', sweep(.85, 300, 6400), at, .11, -.3)
        elif kind in ['page', 'stack']: add('foley', sweep(.38, 450, 6000), at, .09, pan)
        elif kind in ['knife', 'edit']: add('foley', sweep(.65, 1800, 8500), at, .07, -.4)
        elif kind in ['marker', 'reject', 'glyph-cut']: add('foley', sweep(.5, 700, 3200), at, .055, .4)
        elif kind in ['print', 'align', 'stamp', 'glyph-land']:
            add('foley', impact(130 if kind == 'stamp' else 240, .22), at, .13 if kind == 'stamp' else .07, pan)
            add('foley', tone(1700, .08, 55), at, .024, pan)
    else:
        if kind in ['camera-pass', 'camera-return']: add('transitions', sweep(.8, 180, 2600), at, .025, -.3 if kind == 'camera-pass' else .3)
        elif kind == 'route': add('transitions', sweep(.45, 750, 3800), at, .035, -.6+(at-6.5)*1.2)
        elif kind in ['tile', 'snap']: add('foley', tone(740+i % 4*110, .35, 17), at, .021 if kind == 'tile' else .045, pan)
        elif kind in ['click', 'grab', 'drop', 'hover']: add('foley', impact(1300, .09), at, .12, .35)
        elif kind in ['archive', 'lock', 'search']:
            add('foley', tone(880, 1.2, 4), at, .055, .2)
            add('foley', tone(1174.66, 1.2, 3), at+.125, .04, -.2)
        elif kind in ['collapse', 'pulse']: add('foley', impact(45, .7), at, .09)

# Early reflections add depth while keeping dry material transients separate.
dry = buses['music'].copy()
for delay, gain in [(.073, .13), (.137, .09), (.233, .06)]:
    offset = round(delay*SR)
    buses['music'][offset:] += dry[:-offset, ::-1]*gain
duck = np.ones(n)
for event in events:
    if event['type'] in ['water', 'stamp', 'click', 'archive', 'knife']:
        at = float(event['t'])
        duck *= 1-.4*np.exp(-np.maximum(clock-at, 0)*7)*(clock >= at)
buses['music'] *= duck[:, None]
envelope = np.clip(clock/.15, 0, 1)*np.clip((24-clock)/1.5, 0, 1)
for start, end in silences[style]:
    envelope *= np.minimum(np.clip((start-clock)/.08, 0, 1)+np.clip((clock-end)/.08, 0, 1), 1)
for bus in buses.values(): bus *= envelope[:, None]
mix = sum(buses.values())
if style == 'chinese-editorial':
    # Shared gain preserves exact stem reconstruction while taming paper transients.
    detector = maximum_filter1d(np.max(np.abs(mix), axis=1), size=481)
    reduction = np.minimum(1, (.045/np.maximum(detector, 1e-9))**.7)
    reduction = gaussian_filter1d(reduction, sigma=96)
    for bus in buses.values(): bus *= reduction[:, None]
    mix = sum(buses.values())
gain = min(1, .75/max(float(np.max(np.abs(mix))), 1e-9))
for bus in buses.values(): bus *= gain
mix = sum(buses.values())
assert np.isfinite(mix).all()
for start, end in silences[style]: assert not np.any(mix[round(start*SR):round(end*SR)])
out.parent.mkdir(parents=True, exist_ok=True)
stem_dir = out.parent/'stems'
stem_dir.mkdir(exist_ok=True)
for name, bus in buses.items(): sf.write(stem_dir/(name+'.wav'), bus, SR, subtype='FLOAT')
sf.write(out, mix, SR, subtype='PCM_24')
report = {'style': style, 'duration': 24, 'sampleRate': SR, 'silences': silences[style], 'events': events, 'peak': float(np.max(np.abs(mix))), 'stems': {name: {'rms': float(np.sqrt(np.mean(bus**2))), 'sectionsRms': [float(np.sqrt(np.mean(bus[i*6*SR:(i+1)*6*SR]**2))) for i in range(4)]} for name, bus in buses.items()}}
(out.parent/'sound-manifest.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'Score: {style}, 4 stems, 2 silences, 24 seconds, peak {report["peak"]:.3f}')
