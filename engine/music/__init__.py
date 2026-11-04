"""engine/music: deterministic numpy score composer, dialogue-priority mixer and audio QA.

    from music import compose, mix, qa
    bed = compose([{start, end, mood, key, intensity, ...}], total, seed, drops=[(a, b)])
    master, buses = mix.mix(music=bed, sfx=sfx, vo=vo)
    report = qa.report(master, vo=buses['vo'], music=buses['music'])

See docs/audio/README.md for the API and the research behind it.
"""
from .composer import compose, MOODS, master_bus  # noqa: F401
from . import dsp, theory, instruments, mix, qa, tracks  # noqa: F401
