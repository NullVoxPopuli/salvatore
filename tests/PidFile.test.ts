import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import fsSync from 'node:fs';
import { PidFile } from 'salvatore';
import { waitOneSecond, wait, isWithinTolerance } from './helpers.ts';

const TEST_PID_PATH = './.test.pid';

const TEST_PID = {
  exists: () => fsSync.existsSync(TEST_PID_PATH),
  remove: () => TEST_PID.exists() && fsSync.rmSync(TEST_PID_PATH),
  writeFake: (pid: number, timestamp: Date, data: any) => {
    fsSync.writeFileSync(
      TEST_PID_PATH,
      JSON.stringify({
        pid,
        timestamp,
        data: data ?? '',
      })
    );
  },
};

describe('PidFile', () => {
  beforeEach(() => {
    TEST_PID.remove();
  });
  afterEach(() => {
    TEST_PID.remove();
  });

  let daemonPid: PidFile;
  beforeEach(() => {
    daemonPid = new PidFile(TEST_PID_PATH);
  });

  test('it exists', () => {
    expect(PidFile).toBeTruthy();
    expect(typeof PidFile).toBe('function');
  });

  describe('.data', () => {
    test('a file was created', () => {
      daemonPid.write();
      expect(fsSync.existsSync(TEST_PID_PATH)).toBe(true);
    });

    describe('arbitrary data', () => {
      [
        'a string',
        21,
        '{}',
        '[]',
        '{ hello: 2 }',
        { hello: 3 },
        [1, 2, 3],
      ].forEach((data) => {
        test(`${JSON.stringify(data)}`, () => {
          daemonPid.write(data);

          expect(daemonPid.data).deep.equal(data);
        });
      });
    });

    describe('non-JSON-serializable', () => {
      [null, undefined].forEach((data) => {
        test(`${data}`, () => {
          daemonPid.write(data);

          expect(daemonPid.data).deep.equal('');
        });
      });
    });
  });

  describe('.uptime', () => {
    test('is a number', () => {
      daemonPid.write();
      expect(typeof daemonPid.uptime).toBe('number');
    });

    test('probably has a non-zero value', async () => {
      daemonPid.write();
      await wait(10);
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
  });

  describe('.isRunning', () => {
    test('the tests are running, right now', async () => {
      await wait(5_000);

      daemonPid.write();
      expect(daemonPid.pid).toBe(process.pid);
      expect(
        daemonPid.isRunning,
        'isRunning: false due to timing differences'
      ).toBe(false);
    });
  });

  describe('.pid', () => {
    test('the pid exists', () => {
      daemonPid.write();
      expect(daemonPid.pid).toBeGreaterThan(1);
    });
  });

  describe('.delete()', () => {
    test('it deletes the file', () => {
      daemonPid.write();
      expect(TEST_PID.exists(), 'pid file exists').toBe(true);
      daemonPid.delete();
      expect(TEST_PID.exists(), 'pid file does not exist').toBe(false);
    });
  });
});
