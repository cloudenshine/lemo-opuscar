"""Inspect real PCM deliveries using the existing scientific audio environment."""
import json
from pathlib import Path
import numpy as np
import soundfile as sf

root = Path(__file__).resolve().parents[2]
for project in ['cloud-ink-v3', 'editorial-v2', 'product-v2']:
    out = root/'films'/project/'out'
    manifest = json.loads((out/'sound-manifest.json').read_text(encoding='utf-8'))
    mix, rate = sf.read(out/'mix.wav')
    assert rate == 48000 and mix.shape == (24*rate, 2)
    assert np.isfinite(mix).all() and 0 < np.max(np.abs(mix)) <= .75
    stems = []
    for name in ['music', 'ambience', 'foley', 'transitions']:
        bus, sample_rate = sf.read(out/'stems'/(name+'.wav'))
        assert sample_rate == rate and bus.shape == mix.shape
        assert np.isfinite(bus).all() and np.sqrt(np.mean(bus**2)) > 1e-6
        assert np.max(np.abs(bus[:, 0]-bus[:, 1])) > 1e-7 or name == 'ambience'
        stems.append(bus)
    assert np.max(np.abs(sum(stems)-mix)) < 2.5e-7, 'Stems must reconstruct the delivered premaster'
    assert len(manifest['silences']) == 2
    for start, end in manifest['silences']:
        for signal in [mix, *stems]: assert not np.any(signal[round(start*rate):round(end*rate)])
    music_rms = manifest['stems']['music']['sectionsRms']
    assert max(music_rms)/min(music_rms) > 1.5, 'Music density must vary between chapters'
    picture_events = json.loads((out/'events.json').read_text(encoding='utf-8'))['ev']
    assert manifest['events'] == picture_events
    for event in picture_events: assert abs(event['t']*24-round(event['t']*24)) < 1e-7
    print(f'PASS {project}: 4 distinct stems, reconstruction, 2 literal silences, stereo, changing music density, picture cue agreement')
