import assert from 'node:assert';
import { PidFile } from 'salvatore/pid';
import fsSync from 'node:fs';

import { pidPath } from './shared.js';

const pidFile = new PidFile(pidPath);
pidFile.write({ exampleB: 'custom-data-from-the-daemon' });

// Can't access the pid until we write the file.
const pid = pidFile.pid;

assert(pid === process.pid, `Pid from file matches process pid.`);

const log = (msg) =>
  console.log(
    `Daemon [${pid}: ${pidFile.exists && pidFile.isRunning ? 'running' : 'not running'}] : ${msg}`
  );

log(`wrote pid file.`);
let start = Date.now();

process.on('exit', () => {
  log(`exiting daemon after ${(Date.now() - start) / 1000}s`);
  pidFile.delete();
});

process.on('UncaughtException', (e) => {
  fsSync.writeFileSync('error.log', JSON.stringify(e));
});

async function run() {
  log('starting 20s timeout');

  setInterval(() => {
    log(`Running for ${(Date.now() - start) / 1000}s`);
  }, 1000);

  await new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
      process.exit(0);
      // This process should "hang" for 20s, and then exit itself
    }, 20_000);
  });
}

await run();
