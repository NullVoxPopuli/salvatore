import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import fsSync from 'node:fs';
import { DaemonPID } from 'daemon-pid-esm';


const TEST_PID_PATH = './.test.pid';

const TEST_PID = {
  exists: () => fsSync.existsSync(TEST_PID_PATH),
  remove: () => TEST_PID.exists() && fsSync.rmSync(TEST_PID_PATH),
  writeFake: (pid: number, timestamp: Date, data: any) => {
    fsSync.writeFileSync(TEST_PID_PATH, JSON.stringify({
      pid,
      timestamp,
      data: data ?? '',
    }));
  }
}

const EXAMPLE_STOPS: Function[] = [];
const EXAMPLES = {
  a: async () => {
    const { start, stop } = await import('./fixtures/example-a/launcher.js');

    const { didStart, wasAlreadyRunning, pidFile } = await start();

    expect({ didStart, wasAlreadyRunning }).deep.equals({ didStart: true, wasAlreadyRunning: false });

    // Sanity checks for the underlying daemon
    // (and the order of these is important)
    expect(pidFile.exists).toBe(true);
    expect(pidFile.isRunning).toBe(true);
    expect(pidFile.pid).not.toBe(process.pid);
    expect(pidFile.data).toBe('custom-data-from-the-daemon');

    EXAMPLE_STOPS.push(() => {
      stop();
      pidFile.delete();
    });
    return { didStart, wasAlreadyRunning, pidFile, stop }
  }
}

function stopExamples() {
  while (EXAMPLE_STOPS.length) {
    let last = EXAMPLE_STOPS.pop();
    last?.();
  }
}

function isWithinTolerance(a: number, b: number, tolerance: number) {
  let delta = Math.abs(a - b)
  console.log({ a, b, delta, tolerance })
  expect(delta).toBeLessThan(tolerance);
}

describe('DaemonPID', () => {
  beforeEach(() => {
    TEST_PID.remove()
    stopExamples();

  });
  afterEach(() => {
    TEST_PID.remove()
    stopExamples();
  });

  let daemonPid: DaemonPID;
  beforeEach(() => {
    daemonPid = new DaemonPID(TEST_PID_PATH)
  })

  describe('.data', () => {
    test('a file was created', () => {
      daemonPid.write();
      expect(fsSync.existsSync(TEST_PID_PATH)).toBe(true);
    });

    describe('arbitrary data', () => {
      ['a string', 21, '{}', '[]', '{ hello: 2 }', { hello: 3 }, [1, 2, 3]].forEach(data => {

        test(`${JSON.stringify(data)}`, () => {
          daemonPid.write(data);

          expect(daemonPid.data).deep.equal(data)
        });
      });
    });

    describe('non-JSON-serializable', () => {
      [null, undefined].forEach(data => {
        test(`${data}`, () => {
          daemonPid.write(data);

          expect(daemonPid.data).deep.equal('');
        });
      });
    });
  })

  describe('.uptime', () => {
    test('is a number', () => {
      daemonPid.write();
      expect(typeof daemonPid.uptime).toBe('number');
    });

    test('probably has a non-zero value', async () => {
      daemonPid.write();
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(daemonPid.uptime).toBeGreaterThan(0);
    });
  });


  describe('.startedAt', () => {
    test('is the correct type', () => {
      daemonPid.write();
      expect(daemonPid.startedAt).toBeInstanceOf(Date);
    });

    test('is not sooner than now', () => {
      let now = Date.now();
      daemonPid.write();

      let asRecorded = new Date(daemonPid.fileContents.timestamp);
      isWithinTolerance(asRecorded.getTime(), now, 100);
    });

    test('represents the actual process start time, as known by the OS', async () => {
      const { pidFile } = await EXAMPLES.a();

      expect(pidFile.exists).toBe(true);
      expect(pidFile.isRunning).toBe(true);

      let asRecorded = new Date(pidFile.fileContents.timestamp);
      isWithinTolerance(asRecorded.getTime(), pidFile.startedAt.getTime(), 1000 /* 1s */);
    });
  });


  describe('.isRunning', () => {
    test('the tests are running, right now', () => {
      daemonPid.write();
      expect(daemonPid.pid).toBe(process.pid);
      expect(daemonPid.isRunning, 'isRunning: false due to timing differences').toBe(false);
    });
  });

  describe('.pid', () => {
    test('the pid exists', () => {
      daemonPid.write();
      expect(daemonPid.pid).toBeGreaterThan(1);
    });
  });

  describe('.kill()', () => {
    test('can be killed', async () => {
      const { pidFile } = await EXAMPLES.a();

      expect(pidFile.exists).toBe(true);
      expect(pidFile.isRunning).toBe(true);

      pidFile.kill(9);

      // process killing is async
      await new Promise(r => setTimeout(r, 100));
      expect(pidFile.isRunning).toBe(false);
    });
  });

  describe('.delete()', () => {
    test('it deletes the file', () => {
      daemonPid.write();
      expect(TEST_PID.exists()).toBe(true);
      daemonPid.delete();
      expect(TEST_PID.exists()).toBe(false);
    })
  });

})


