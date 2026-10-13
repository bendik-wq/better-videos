// LEDGER kit demo, vertical: every set once with real VO (shots in ./demo-shots.mjs). Independent channel, not affiliated with micro1.
import { episode } from './episode.mjs';
import { demoShots } from './demo-shots.mjs';

// vertical demo (this directory) -> renders/micro1-kit/demo.mp4; the 16:9 demo lives in ./demo-16x9
export default episode({ title: 'LEDGER kit demo', shots: demoShots('9:16') });
