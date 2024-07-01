![Damon Salvatore, from _The Vampire Diaries_ looking like "wat"](./assets/damon-wat.jpg)

# Salvatore, Daemon

_0 dependency daemon management for Node_.

and

_A replacement for [`pm2`](https://github.com/Unitech/pm2/issues/5143) that isn't copyleft_.

-------------

DaemonPID is a Node utility module which provides straight-forward and robust PID file management; perfect for writing and reading PID files for daemonized services. It provides the ability to check or monitor the status of previously launched child processes, store additional data along with the process id, and provides process start-time verification to ensure the recorded process-id was not recycled by the OS.

- [Basic Usage](#basic-usage)
- [Advance Usage](#advanced-usage)
- [API](#api)

**Warning: this module is for POSIX systems and will not function on Windows. If you're a Windows veteran and would like to make it work, please feel free to contribute!**


## Features

✨ Maintained  
🦹🏽 ESM  
☁️ High-level API  
⏱️ No callbacks - uses Promises  
😎 TypeScript-friendly  
🙂‍↔️ Compatible with MacOS and Linux

Daemon features:
- can "start" multiple times and retain the same process
- process keeps running after main program exits
- configurable logging to file


## What is a PID file?

A PID file is a text file in a well-defined location in the 
file-system which contains at-least the process ID of a running application. 
Writing PID files is a convention used in many software systems as a simple 
way to check the status of services or daemonized processes without requiring 
separate supervisory or monitoring processes.


## PID File Pitfalls 

Process IDs are not required to be unique and can potentially be recycled. To solve this issue, `salvatore` also records and checks the `command` and start time of the process for future comparison and status checks.

## What is a Daemon? 

A daemon is a program that runs in the background, rather than under direct control of an interactive user. It typically performs routine tasks or provides services such as managing printers, handling emails, or serving web pages. Daemons are common in Unix-like operating systems and are crucial for system functionality by handling system processes independently of user input. They often start when the system boots and run continuously until the system shuts down. 

[more info on wikipedia](https://en.wikipedia.org/wiki/Daemon_(computing)).

### `import { PidFile } from 'salvatore'`

The `PidFile` provides a number of methods and getters for working with PID files and helping you build tools that could use process-based tooling.


_**For an example, with logging, check out the `examples/pidfile` folder.**_


_For the child process_:

```js
// child.js
import { PidFile } from 'salvatore';

const pidFile = new PidFile('.some.file.pid');

// writes-out the pid file
// this will include 
// - pid
// - startedAt (Date)
// - command (initiator and script)
// - any custom data you wish to pass to your parent process
pidFile.write(/* custom JSON-serializable data here */);

// cleanup isn't strictly necesary, but it's a helpful debugging tool
// as you could assume that no pid file could mean that no process is running.
process.on('exit', function() {
    pidFile.delete();
});
```

_For the parent process_: 

```js
import { PidFile } from 'salvatore';
import { spawn } from 'node:child_process';

// file path should match the above
const pidFile = new PidFile('.some.file.pid');

const process = spawn(process.argv0, []'child.js'], {
    detached: true,
    stdio: 'ignore',
});

// some time later:
//   ask questions of the pidFile
pidFile.data  // JSON.parse result of what was passed to pidFile.write in child
pidFile.uptime // number
pidFile.startedAt // Date
pidFile.isRunning // boolean
pidFile.pid // number - the PID
pidFile.fileContents // object - raw pidFile contents
pidFile.exists // boolean - has the pid file been written?
pidFile.command // string - the initiator and script that started the child process

//   perform actions on the child process via the pidFile
pidFile.kill(signal); // -- stops the process, must pass a number / SIGINT / SIGTERM type string
```

### `import { Daemon } from 'salvatore'`

In the file-to-be-daemonized:
```js
// waiter.js
import { PidFile } from 'salvatore';

const pidFile = new PidFile('.example.pid');

pidFile.write();
process.on('exit', () => pidFile.delete());

async function run() {
  await new Promise((resolve) => {
    // force the process to stay running for 20s
    setTimeout(() => resolve(null), 20_000);
  });
}

await run();
```

a small CLI for managing the daemon:
```js 
#!/usr/bin/env node

import { Daemon } from 'salvatore';

const daemon = new Daemon('./waiter.js', { pidFilePath: '.example.pid' });
const [,, ...args] = process.argv;
const [command] = args;

async function main() {
  switch (command) {
    case 'start': return daemon.ensureStarted();
    case 'stop': return daemon.stop();
    case 'status': return console.log(JSON.stringify(daemon.info));
    default: throw new Error(`Command not recognized`);
  }
}

await main();
```
    
### Storing Data

Additional information can be stored in the PID file for use later. Any data convertible to JSON can be stored. This could be useful for starting a server and then reading out what PORT that server had started on:

In the daemonized file:
```js
// server.js
import { PidFile } from 'salvatore';
import express from 'express';

const pidfile = new PidFile('.express.pid');

const app = express();

const listener = app.listen(8888, function () {
    let { port, host } = listener.address();

    pidFile.write({
        port,
        host,
    })
});
```

and then in the bootstrap / cli / start script
```js 
#!/usr/bin/env node
import { Daemon } from 'salvatore';

const daemon = new Daemon('./server.js', { pidFilePath: '.express.pid' });
const [,, ...args] = process.argv;
const [command] = args;

async function main() {
  switch (command) {
    case 'start':
      return daemon.ensureStarted();
    // ...
    case 'address': {
      const { host, port } = daemon.info.data

      console.log({ host, port })
    }
  }
}

await main();
```

## Examples

See the `examples` directory for examples.

Each example has a CLI with these commands:
```bash
./cli.js start # starts the example daemon
./cli.js stop # stops the example daemon
./cli.js status # prints status about the daemon
```

Example:
```bash 
salvatore/examples/daemon/
❯ ./cli.js status

    Running: true
    PID:     49443
    Started: Fri Jun 28 2024 12:35:32 GMT-0400 (Eastern Daylight Time)
    Uptime:  4783086 
    Data:    "custom-data-from-the-daemon"
  

```


### Contributing

1. fork it
2. change it
3. pr it
4. 🎉 collab time 🎉


#### Notes

Each test that operates on the examples folder runs in its own tmp directory. This is because we need a unique pid file for each test, and in order to run the tests in parallel, this is the only way to not run in to issues with one test reading another's pid file.


### Why "Salvatore"

I've pronounced "Daemon" as "Damon" my whole life, and I can't stop.
I know that literature out there says that "Daemon" is supposed to be prounced like "Demon", but 1. I don't like that, and 2. I appreciate the disambiguation. Though, after having working through this project now, debugging mac vs linux issues, I understand why folks would call these things demons. oofta.

Damon Salvatore is the name of a character in _[The Vampire Diaries](https://www.imdb.com/title/tt1405406/)_, and since I prounce "Daemon" as "Damon", it was a natural fit.





-----------------

Original project: [daemon-pid](https://github.com/JoshuaToenyes/daemon-pid) - [published code](https://www.npmjs.com/package/daemon-pid?activeTab=code)
