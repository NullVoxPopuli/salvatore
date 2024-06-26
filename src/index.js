import { exec } from "node:child_process";
import fs from "node:fs";
import process from "node:process";

const DEFAULT_MONITOR_INTERVAL = 5_000; /* 5 seconds */

/**
 * Implements a pid file management class capable of monitoring processes using
 * pid files stored at known locations. Designed for use in daemonized processes.
 */
export class DaemonPID {
  #pidFilePath;
  #pid;
  #monitor;

  /**
   * The path of the Pid file
   */
  constructor(pidFilePath) {
    this.#pidFilePath = _pidFilePath;
    this.#pid = process.pid;
    this.#monitor = null;
  }

  /**
   * Writes out the PID file with the optional JSON-able data attached. Calls the
   * callback function with (err).
   */
  write = () => {
    return this._started(
      this._pid,
      (function (_this) {
        return function (err, started) {
          var d, e, f, s;
          if (err) {
            if (cb != null) {
              cb.call(err);
            }
            return;
          }
          try {
            if (data !== void 0) {
              s = new Buffer(JSON.stringify(data)).toString("base64");
            } else {
              s = "";
            }
            d = [_this._pid, started.getTime(), s].join("\n");
            f = {
              mode: 0x120,
              flag: "wx",
            };
            return fs.writeFile(_this._pidFilePath, d, f, function (err) {
              return cb != null ? cb.call(null, err) : void 0;
            });
          } catch (_error) {
            e = _error;
            return cb != null ? cb.call(null, e) : void 0;
          }
        };
      })(this),
    );
  };

  read = () => {
    return this._read(function (err, _arg) {
      var data, pid, start;
      (pid = _arg[0]), (start = _arg[1]), (data = _arg[2]);
      return cb != null ? cb.call(null, err, data) : void 0;
    });
  };

  delete = () => {
    return fs.unlink(this._pidFilePath, function (err) {
      return cb != null ? cb.call(null, err) : void 0;
    });
  };

  uptime = () => {
    return this.started(function (err, date) {
      var t;
      if (err != null) {
        return cb != null ? cb.call(null, err) : void 0;
      } else {
        t = parseInt((Date.now() - date.getTime()) / 1000);
        return cb != null ? cb.call(null, void 0, t) : void 0;
      }
    });
  };

  started = () => {
    return this._running(function (err, running, actualStart) {
      if (!running) {
        return cb != null
          ? cb.call(null, new Error("Process not running."))
          : void 0;
      } else {
        return cb != null ? cb.call(null, err, actualStart) : void 0;
      }
    });
  };

  running = () => {
    return this._running(function (err, running, actualStart, data) {
      if (err && err.code === "ENOENT") {
        return cb != null ? cb.call(null, void 0, false, void 0) : void 0;
      } else {
        return cb != null ? cb.call(null, err, running, data) : void 0;
      }
    });
  };

  monitor = () => {
    var check;
    if (interval == null) {
      interval = DEFAULT_MONITOR_INTERVAL;
    }
    if (this._monitor) {
      clearInterval(this._monitor);
    }
    check = (function (_this) {
      return function () {
        return _this.running(function (err, running) {
          if (err || !running) {
            clearInterval(this._monitor);
            return cb != null ? cb.call(null, err) : void 0;
          }
        });
      };
    })(this);
    this._monitor = setInterval(check, interval);
  };

  unmonitor = () => {
    clearInterval(this._monitor);
  };

  kill = () => {
    return this._errorIfNotRunning(
      cb,
      (function (_this) {
        return function () {
          return _this._read(function (err, _arg) {
            var e, pid;
            pid = _arg[0];
            try {
              process.kill(pid, signal);
              return cb.call(null, void 0);
            } catch (_error) {
              e = _error;
              return cb.call(null, e);
            }
          });
        };
      })(this),
    );
  };

  pid = () => {
    return this._errorIfNotRunning(
      cb,
      (function (_this) {
        return function () {
          return _this._read(function (err, _arg) {
            var pid;
            pid = _arg[0];
            return cb.call(null, err, pid);
          });
        };
      })(this),
    );
  };

  #errorIfNotRunning = () => {
    return this.#running(function (err, running) {
      if (err) {
        cb.call(null, err);
        return;
      }
      if (!running) {
        cb.call(null, new Error("Process not running."));
        return;
      }
      return cont();
    });
  };

  #running = async () => {
    let { pid, recordedStart, data } = await this.#read();

    await this.#started(pid);

    return async.waterfall(
      [
        (function (_this) {
          return function (callback) {
            return _this._read(function (err, _arg) {
              var data, pid, recordedStart;
              (pid = _arg[0]), (recordedStart = _arg[1]), (data = _arg[2]);
              if (!_this._pidRunning(pid)) {
                return cb != null ? cb.call(null, void 0, false) : void 0;
              } else {
                return callback.call(null, err, pid, recordedStart, data);
              }
            });
          };
        })(this),
        (function (_this) {
          return function (pid, recordedStart, data, callback) {
            return _this._started(pid, function (err, actualStart) {
              return callback.call(null, err, recordedStart, actualStart, data);
            });
          };
        })(this),
        function (recordedStart, actualStart, data, callback) {
          var running;
          running = Math.abs(actualStart.getTime() - recordedStart) < 1000;
          return callback.call(null, void 0, running, actualStart, data);
        },
      ],
      function (err, running, actualStart, data) {
        running = err !== void 0 ? false : running;
        return cb != null
          ? cb.call(null, err, running, actualStart, data)
          : void 0;
      },
    );
  };

  #pidRunning = () => {
    try {
      process.kill(pid, 0);
      return true;
    } catch (_error) {
      console.log("what is this? we shouldnt catch everything");
      return false;
    }
  };

  #started = (pid) => {
    return exec('ps -o "lstart=" ' + pid, function (err, stdout) {
      if (err) {
        return cb != null ? cb.call(null, err) : void 0;
      } else {
        return cb != null ? cb.call(null, void 0, new Date(stdout)) : void 0;
      }
    });
  };

  #read = () => {
    return fs.readFile(this._pidFilePath, function (err, contents) {
      var data, data64, e, pid, start, _ref;
      if (err) {
        if (cb != null) {
          cb.call(null, err, []);
        }
        return;
      }
      try {
        (_ref = contents.toString().split("\n")),
          (pid = _ref[0]),
          (start = _ref[1]),
          (data64 = _ref[2]);
        if (data64.length > 0) {
          data = JSON.parse(new Buffer(data64, "base64").toString());
        } else {
          data = void 0;
        }
        return cb != null
          ? cb.call(null, void 0, [+pid, +start, data])
          : void 0;
      } catch (_error) {
        e = _error;
        return cb != null ? cb.call(null, e, []) : void 0;
      }
    });
  };
}
