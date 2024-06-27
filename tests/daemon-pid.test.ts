import { describe, expect, test } from 'vitest';
import fsSync from 'node:fs';
import { DaemonPID } from 'daemon-pid-esm';


const TEST_PID_PATH = './.test.pid';

const TEST_PID = {
  exists: () => fsSync.existsSync(TEST_PID_PATH),
  remove: () => fsSync.rmSync(TEST_PID_PATH),
  writeFake: (pid: number, timestamp: Date, data: any) => {
    fsSync.writeFileSync(TEST_PID_PATH, JSON.stringify({
      pid,
      timestamp,
      data: data ?? '',
    }));
  }
}

describe('DaemonPID', () => {

})


