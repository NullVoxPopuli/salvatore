import { PidFile } from 'salvatore/pid';

import { pidPath } from './shared.js';

const pidFile = new PidFile(pidPath);
pidFile.write('custom-data-from-the-daemon');
const pid = pidFile.pid;

const log = (msg) =>
  console.log(
    `PidFile [${pid}: ${pidFile.exists && pidFile.isRunning ? 'running' : 'not running'}] : ${msg}`
  );

log(process.argv.join(', '));
log(`wrote pid file.`);
log(`process.pid: ${process.pid}`);
let start = Date.now();

process.on('exit', () => {
  log(`exiting daemon after ${(Date.now() - start) / 1000}s`);
  pidFile.delete();
});

async function run() {
  log(`starting timeout`);
  setInterval(() => {
    log(`Has been running for ${(Date.now() - start) / 1000}s (so far)`);
  }, 1000);
  await new Promise((resolve) => {
    setTimeout(() => {
      log('ending timeout');
      resolve(null);
      process.exit(0);
      // This process should "hang" for 2s, and then exit itself
    }, 2_000);
  });
}

await run();
