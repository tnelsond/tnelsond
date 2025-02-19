/*
  2022-09-19

  The author disclaims copyright to this source code.  In place of a
  legal notice, here is a blessing:

  *   May you do good and not evil.
  *   May you find forgiveness for yourself and forgive others.
  *   May you share freely, never taking more than you give.

  ***********************************************************************

  A basic demonstration of the SQLite3 "OO#1" API.
*/
"use strict";
(function () {
    /**
     Set up our output channel differently depending
     on whether we are running in a worker thread or
     the main (UI) thread.
  */
    let logHtml;
    if (globalThis.window === globalThis /* UI thread */) {
        console.log("Running demo from main UI thread.");
        logHtml = function (cssClass, ...args) {
            const ln = document.createElement("div");
            if (cssClass) ln.classList.add(cssClass);
            ln.append(document.createTextNode(args.join(" ")));
            document.body.append(ln);
        };
    } else {
        /* Worker thread */
        console.log("Running demo from Worker thread.");
        logHtml = function (cssClass, ...args) {
            postMessage({
                type: "log",
                payload: { cssClass, args },
            });
        };
    }
    const dstyle = {};
    dstyle["kh"] = '<h3 class="hent">###</h3>';
    dstyle["w"] = '<h3 class="hent">###</h3>';
    dstyle["h97"] = '<p style="color: #240074"><span class="tag is-small">Headley 97</span><br>###</p>';
    dstyle["h77"] = '<p style="color: #007400"><span class="tag is-small">Headley 77</span><br>###</p>';
    dstyle["khdef"] = '<p><span class="tag is-small">Chuon Nath 2023</span><br>###</p>';
    dstyle["def"] = '<p><span class="tag is-small">Sonveasna</span><br>###</p>';
    dstyle["khph"] = dstyle["khpos"] = '<p style="color: #740000">###</p>';
    dstyle["csea"] = '<span style="color: red">###</span><sup>csea</sup> ';
    dstyle["ckhsv"] = '<span style="color: purple">###</span><sup>ckhsv</sup> ';
    dstyle["ckhov"] = '<span style="color: green">###</span><sup>ckhov</sup> ';
    dstyle["cchrist"] = '<span style="color: blue">###</span><sup>cchrist</sup> ';
    dstyle["lyrics"] = '<p style="color:#000044">###</p>';
    dstyle["misc"] = '<span style="color: #662200">###</span> ';
    dstyle["m"] = '<span style="color: #770066">###</span> ';
    dstyle["context"] = '<details class="context"><h2>Words Before:</h2>###</details> ';

    onmessage = (e) => {
        console.log("Worker: Message received from main script#: " + e.data);
        console.log("Worker: Posting message back to main script");
        //  addEntry(e.data);
        if (e.data.startsWith(".init: ")) {
            db.exec({
                sql: "PRAGMA table_info(" + e.data.substring(7) + ");",
                rowMode: "array", // 'array' (default), 'object', or 'stmt'
                callback: function (row) {
                    ++this.counter;
                    logHtml("init", row[1]);
                }.bind({ counter: 0 }),
            });
							db.exec({
								sql: "SELECT data from audio where title='កក.ogg';",
								rowMode: 'object',
								callback: function(row){
									log("row ",++this.counter,"=",JSON.stringify(row.data) + "\n" + typeof(row));
									sendAudio(row.data);
								}.bind({counter: 0})
							});
        } else {
            console.log("Worker:" + e.data);
            const lopokup = e.data.match(/SELECT (.*) FROM/)[1].split(", ");
            const que = ("^" + e.data.match(/LIKE '(.*)' /)[1] + "$").replace("^%", "").replace("%$", "").replace("_", ".");
            console.log("query!: " + que);
            const quer = new RegExp(que, "mgi");
            console.log(quer);
            console.log(lopokup);
            db.exec({
                sql: e.data,
                rowMode: "array", // 'array' (default), 'object', or 'stmt'
                callback: function (row) {
                    ++this.counter;
                    let res = "";
                    for (let i = 0; i < row.length; ++i) {
                        if (row[i]) {
                            row[i] = row[i].toString().replace(quer, '<span class="highlight">$&</span>');
                            let sty = dstyle[lopokup[i]];
                            if (sty) {
                                res += sty.replace("###", row[i]);
                            } else {
                                res += row[i] + "<br />";
                            }
                        }
                    }
                    addEntry("" + res + "");
                    //addEntry(row.join('</div><div class="col">'));
                }.bind({ counter: 0 }),
            });
        }
    };

    const log = (...args) => logHtml("", ...args);
    const addEntry = (...args) => logHtml("entry", ...args);
    const sendAudio = (...args) => logHtml("audio", ...args);
    const warn = (...args) => logHtml("bg-warning", ...args);
    const error = (...args) => logHtml("bd-error", ...args);
    var db;
    const demo1 = function (sqlite3, dbUrl, immutable = false) {
        fetch(dbUrl)
            .then((res) => res.arrayBuffer())
            .then((arrayBuffer) => {
                if (!immutable) {
                    arrayBuffer.resizeable = true;
                }
                const p = sqlite3.wasm.allocFromTypedArray(arrayBuffer);
                db = new sqlite3.oo1.DB();
                let deserialize_flags = sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE;
                if (!immutable) {
                    deserialize_flags |= sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE;
                }
                const rc = sqlite3.capi.sqlite3_deserialize(db.pointer, "main", p, arrayBuffer.byteLength, arrayBuffer.byteLength, deserialize_flags);
                db.checkRc(rc);

                db.exec({
                    sql: "SELECT name FROM sqlite_master WHERE type='table' order by name asc;",
                    rowMode: "array", // 'array' (default), 'object', or 'stmt'
                    callback: function (row) {
                        logHtml("dictlist", '<option value="' + row + '">' + row + "</option>");
                    }.bind({ counter: 0 }),
                });

                logHtml("refresh", "");

                //        xplorer.setDb(db);
            });
    };

    log("Loading and initializing sqlite3 module...");
    if (globalThis.window !== globalThis) {
        /*worker thread*/ /*
      If sqlite3.js is in a directory other than this script, in order
      to get sqlite3.js to resolve sqlite3.wasm properly, we have to
      explicitly tell it where sqlite3.js is being loaded from. We do
      that by passing the `sqlite3.dir=theDirName` URL argument to
      _this_ script. That URL argument will be seen by the JS/WASM
      loader and it will adjust the sqlite3.wasm path accordingly. If
      sqlite3.js/.wasm are in the same directory as this script then
      that's not needed.

      URL arguments passed as part of the filename via importScripts()
      are simply lost, and such scripts see the globalThis.location of
      _this_ script.
    */
        let sqlite3Js = "sqlite3.js";
        const urlParams = new URL(globalThis.location.href).searchParams;
        log("urlParams: " + urlParams);
        if (urlParams.has("sqlite3.dir")) {
            sqlite3Js = urlParams.get("sqlite3.dir") + "/" + sqlite3Js;
            log("sqlite3: " + sqlite3Js);
        }
        importScripts(sqlite3Js);
    }
    globalThis
        .sqlite3InitModule({
            /* We can redirect any stdout/stderr from the module like so, but
       note that doing so makes use of Emscripten-isms, not
       well-defined sqlite APIs. */
            print: log,
            printErr: error,
        })
        .then(function (sqlite3) {
            //console.log('sqlite3 =',sqlite3);
            log("Done initializing. Running demo...");
            try {
                demo1(sqlite3, "tdict8.db.html");
            } catch (e) {
                error("Exception:", e.message);
            }
        });
})();
