import { DaemonPID } from 'salvatore/pid';

import { pidPath } from './shared.js';

const pid = new DaemonPID(pidPath);

pid.write('custom-data-from-the-daemon');

async function run() {
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
      process.exit(0);
      // This process should "hang" for 2s, and then exit itself
    }, 2_000);
  });
}

await run();
