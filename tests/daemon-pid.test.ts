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

describe('DaemonPID', () => {
  beforeEach(() => {
    TEST_PID.remove()
  });
  afterEach(() => {
    TEST_PID.remove()
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
      expect(typeof daemonPid.startedAt).toBe('number');
    });

    test('is not sooner than the when it was started', () => {
      let now = Date.now();
      daemonPid.write();
      expect(daemonPid.startedAt).toBeGreaterThanOrEqual(now);
    });
  });


  describe('.isRunning', () => {
    test('the tests are running, right now', () => {
      daemonPid.write();
      expect(daemonPid.isRunning).toBe(true);
    });
  });

  describe('.pid', () => {
    test('the pid exists', () => {
      daemonPid.write();
      expect(daemonPid.pid).toBeGreaterThan(1);
    });
  });

  describe('.kill()', () => {
    test('TODO', () => {
      expect(false).toBe(true);
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


