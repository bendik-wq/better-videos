// LEDGER kit demo in 16:9 (1920x1080): the same shots as ../project.mjs, the cta in its default 'link' mode.
import { episode } from '../episode.mjs';
import { demoShots } from '../demo-shots.mjs';
export default episode({ title: 'LEDGER kit demo 16:9', aspect: '16:9', shots: demoShots('16:9') });
