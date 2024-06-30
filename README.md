# Salvatore, Daemon


DaemonPID is a NodeJS utility module which provides straight-forward and robust PID file management; perfect for writing and reading PID files for daemonized services. It provides the ability to check or monitor the status of previously launched child processes, store additional data along with the process id, and provides process start-time verification to ensure the recorded process-id was not recycled by the OS.

- [Basic Usage](#basic-usage)
- [Advance Usage](#advanced-usage)
- [API](#api)

**Warning: this module is for POSIX systems and will not function on Windows. If you're a Windows veteran and would like to make it work, please feel free to contribute!**




## What is a PID file?

A PID file is essentially a text file in a well-defined location in the 
file-system which contains at-least the process ID of a running application. 
Writing PID files is a convention used in many software systems as a simple 
way to check the status of services or daemonized processes without requiring 
separate supervisory or monitoring processes.




## PID File Pitfalls 

Process IDs are not required to be unique and can potentially be recycled. To solve this issue, DaemonPID also records and checks the start-time of the process for future comparison and status checks.




## Basic Usage

Here's a basic use-case of DaemonPID in a daemonized process.

### Inside Child Process

```js
import { PidFile } from 'salvatore';

const pid = new PidFile('.some.file.pid');

// writes-out the pid file
pid.write();

// on SIGTERM delete the pid file
process.on('SIGTERM', function() {
    try {
        pid.delete();
    } catch (e) {
        
    }
  pid.delete(function(err) {
    if (err) console.error('Something we wrong deleting the pid file!');
  });
});
```

### Inside Launch Script or CLI

    pid = require('daemon-pid')(PID_FILE_PATH);
    spawn = require('child_process').spawn;
    
    child = spawn('node', [SERVICE_FILE], {
        detached: true,
        stdio: ['ignore']
    });
    
    // remove the pid file on exit
    child.on('close', function(code) {
        pid.delete(function(err) {
            // err indicates error deleting pid file
        });
    });

### Status Checking Script or CLI

    pid = require('daemon-pid')(PID_FILE_PATH);
    
    pid.running(function(err, running) {
        if (running) {
            console.log('service is running as expected');
        } else {
            console.error('service is down!');
        }
    });




## Advanced Usage
    
### Storing Data

Additional information can be stored in the PID file for use later. Any data convertible to JSON can be stored.

    pid = require('daemon-pid')(PID_FILE_PATH);
    
    // writes-out the pid file with additional data
    pid.write(function(err) {
        // err indicates error writing pid file
    }, SERVICE_PORT_NUMBER);

In another script that data can later be retreived:

    pid = require('daemon-pid')(PID_FILE_PATH);
    
    // writes-out the pid file with additional data
    pid.read(function(err, port) {
        if (err) {
            console.error('unable to read pid file');
        } else {
            console.log('service running on port ' + port);
        }
    });

### Simple Status Monitor

It's easy to implement a simple status-monitor as a separate process.

    pid = require('daemon-pid')(PID_FILE_PATH);
    
    pid.monitor(function(err) {
        if (err) {
            console.error('unable to read pid file');
        } else {
            console.error('service went down!');
        }
    });


## Examples

See the `tests/fixtures` directory for examples.

Each example has a CLI with these commands:
```bash
./cli.js start # starts the example daemon
./cli.js stop # stops the example daemon
./cli.js status # prints status about the daemon
```

Example:
```bash 
salvatore/tests/fixtures/example-b
❯ ./cli.js status

    Running: true
    PID:     49443
    Started: Fri Jun 28 2024 12:35:32 GMT-0400 (Eastern Daylight Time)
    Uptime:  4783086 
    Data:    "custom-data-from-the-daemon"
  

```

### Basic Use Case Example

The basic example offers a very simple CLI in `cli.js` and the canonical "Hello World" web server as a service to be daemonized (in `server.js`). Just `cd` into that directory and run `node cli.js start` to start the server, `node cli.js stop` to stop it, and `node cli.js status` to see the current status of the server process.

### Contributing

1. fork it
2. change it
3. pr it
4. 🎉 collab time 🎉


#### Notes

Each test that operates on the examples folder runs in its own tmp directory. This is because we need a unique pid file for each test, and in order to run the tests in parallel, this is the only way to not run in to issues with one test reading another's pid file.


-----------------

Original project: [daemon-pid](https://github.com/JoshuaToenyes/daemon-pid) - [published code](https://www.npmjs.com/package/daemon-pid?activeTab=code)
