# Clip library spec for retarget.py. Sources: CMU Graphics Lab Motion Capture Database
# (http://mocap.cs.cmu.edu, "free for all uses"; please cite CMU), BVH conversion by Bruce Hahne
# (cgspeed), fetched from github.com/una-dinosauria/cmu-mocap (raw URLs).
# kind: 'cycle' = locomotion, made in-place with stored forward speed; 'idle' = looped in place;
# 'once' = plays once (loop False). range = seconds of the source used. period = loop length bounds.
CLIPS = {
  # ---- locomotion
  'walk':        dict(src='35_01', kind='cycle', desc='casual walk'),
  'walk_b':      dict(src='16_15', kind='cycle', desc='walk, second actor'),
  'walk_c':      dict(src='08_01', kind='cycle', desc='walk, third actor'),
  'walk_slow':   dict(src='07_04', kind='cycle', period=(1.0, 1.8), desc='slow walk'),
  'walk_brisk':  dict(src='91_17', kind='cycle', range=(1.0, 6.0), desc='quick walk'),
  'walk_sad':    dict(src='82_10', kind='cycle', period=(1.0, 1.9), desc='sad walk, head down'),
  'walk_heavy':  dict(src='17_08', kind='cycle', desc="muscular, heavyset person's walk"),
  'march':       dict(src='138_01', kind='cycle', range=(0.5, 6.5), desc='soldiers march'),
  'jog':         dict(src='35_17', kind='cycle', period=(0.55, 0.9), blend=0.2, contact_v=1.2, contact_h=0.09, desc='jog'),
  'run':         dict(src='09_01', kind='cycle', period=(0.5, 0.85), blend=0.15, contact_v=1.4, contact_h=0.1, desc='run'),
  # ---- standing
  'idle':        dict(src='137_28', kind='idle', desc='normal wait, weight shifts'),
  'idle_b':      dict(src='111_28', kind='idle', desc='standing still'),
  'idle_c':      dict(src='113_21', kind='idle', desc='standing still, second actor'),
  'wait':        dict(src='40_10', kind='idle', range=(0, 30), desc='waiting for a bus: looks around, checks'),
  'look_around': dict(src='77_02', kind='idle', desc='standing, looking around'),
  'talk':        dict(src='18_08', kind='idle', desc='conversation, explaining with hand gestures'),
  'talk_b':      dict(src='19_08', kind='idle', desc='conversation, the listener / second speaker'),
  'argue':       dict(src='80_48', kind='idle', desc='arguing, emphatic gestures'),
  'point':       dict(src='139_25', kind='idle', hands={'r': 'point'}, desc='giving directions: points'),
  'phone':       dict(src='80_25', kind='once', loop=False, hands={'r': 'grip'}, desc='answers a phone'),
  'fists':       dict(src='56_02', kind='idle', range=(0, 8), hand='fist', desc='fists up'),
  # ---- seated (pelvis + legs from 18_12, upper body layered from the typing take)
  'sit_idle':    dict(src='18_12', kind='idle', ground=False, footlock=True, desc='seated, relaxed'),
  'sit_type':    dict(src='18_12', kind='idle', ground=False, upper=dict(src='79_85', range=(0, 8.6), **{'from': 'spine_02'}), hand='typing', desc='seated, typing'),
  'sit_think':   dict(src='13_04', kind='idle', range=(7.5, 17.5), ground=False, desc='seated on a stool, chin in hand'),
  # ---- pacing (keeps root motion: walks forward, turns, walks back)
  'pace':        dict(src='36_02', kind='idle', range=(0, 16), anchor=False, footlock=True, period=(6, 15), desc='walk forward, turn around, walk back'),
}
