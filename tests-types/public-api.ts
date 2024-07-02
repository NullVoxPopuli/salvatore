import { Daemon, PidFile } from 'salvatore';
import { expectTypeOf } from 'expect-type';
import type { SignalConstants } from 'node:os';

////////////////
// Daemon
////////////////
expectTypeOf<ConstructorParameters<typeof Daemon>>().toMatchTypeOf<
  [string, object]
>();
expectTypeOf<ConstructorParameters<typeof Daemon>>().toEqualTypeOf<
  [
    string,
    {
      pidFilePath: string;
      runWith?: string;
      timeout?: number;
      logFile?: string;
      restartWhen?: () => boolean;
    },
  ]
>();
// getters
expectTypeOf<Daemon['info']>().toEqualTypeOf<{
  pid: number;
  data: any;
  command: string;
  startedAt: Date | null;
  isRunning: boolean;
}>();
// methods
expectTypeOf<Daemon['ensureStarted']>().toEqualTypeOf<
  () => Promise<Daemon['info']>
>();
expectTypeOf<Daemon['stop']>().toEqualTypeOf<() => Promise<void>>();

////////////////
// PidFile
////////////////
expectTypeOf<ConstructorParameters<typeof PidFile>>().toEqualTypeOf<[string]>();
// getters
expectTypeOf<PidFile['command']>().toEqualTypeOf<string>();
expectTypeOf<PidFile['data']>().toEqualTypeOf<any>();
expectTypeOf<PidFile['exists']>().toEqualTypeOf<boolean>();
expectTypeOf<PidFile['fileContents']>().toEqualTypeOf<{
  pid: number;
  timestamp: string;
  data: any;
  command: string;
}>();
expectTypeOf<PidFile['isRunning']>().toEqualTypeOf<boolean>();
expectTypeOf<PidFile['pid']>().toEqualTypeOf<number>();
expectTypeOf<PidFile['startedAt']>().toEqualTypeOf<Date>();
expectTypeOf<PidFile['uptime']>().toEqualTypeOf<number>();
// methods
expectTypeOf<PidFile['write']>().toEqualTypeOf<(data?: unknown) => void>();
expectTypeOf<PidFile['delete']>().toEqualTypeOf<() => void>();
expectTypeOf<PidFile['kill']>().toMatchTypeOf<(signal: number) => void>();
expectTypeOf<PidFile['kill']>().toMatchTypeOf<
  (signal: keyof SignalConstants) => void
>();
