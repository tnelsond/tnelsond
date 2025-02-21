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
    dstyle["Tonga"] = '<h3 class="hent">###</h3>';
    dstyle["English"] = '<h4 class="hent" style="color:#110044">###</h3>';
    dstyle["PartOfSpeech"] = '<span class="tag" style="color: #770066">###</span>';
    dstyle["Class"] = '<span class="tag" style="color: #443300">Class: ###</span>';
    dstyle["Corrupt"] = '<span class="tag" style="color: #770000">Corrupt: ###</span>';
    dstyle["Dialect"] = '<span class="tag" style="color: #002266">Dialect: ###</span>';

    onmessage = (e) => {
        console.log("Worker: Message received from main script#: " + e);
        console.log("Worker: Data received from main script#: " + e.data);
        console.log("Worker: Posting message back to main script");
        //  addEntry(e.data);
				if(db){
        if (e.data.startsWith(".init: ")) {
            db.exec({
                sql: "PRAGMA table_info(" + e.data.substring(7) + ");",
                rowMode: "array", // 'array' (default), 'object', or 'stmt'
                callback: function (row) {
                    ++this.counter;
                    logHtml("init", row[1]);
                }.bind({ counter: 0 }),
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
														let temp = row[i].toString();
                            let sty = dstyle[lopokup[i]];
														if(sty){
															if(lopokup[i] == 'Class'){
																temp = temp.replace(/\b1\b/, "1 (People and animal nouns)");
																temp = temp.replace(/\b2\b/, "2 (Plural of people and animal nouns; also used to denote respect)");
																temp = temp.replace(/\b3\b/, "3 (Non-animal or person nouns beginning with MU)");
																temp = temp.replace(/\b4\b/, "4 (Plural non-animal or person nouns beginning with MU)");
																temp = temp.replace(/\b5\b/, "5 (Nouns begining with I or are corrupted)");
																temp = temp.replace(/\b6\b/, "6 (Plural nouns begining with I or are corrupted)");
																temp = temp.replace(/\b7\b/, "7 (Inanimate objects and nouns beginning with CI)");
																temp = temp.replace(/\b8\b/, "8 (Plural inanimate objects and nouns beginning with CI)");
																temp = temp.replace(/\b9\b/, "9 (Nouns beginning with NG)");
																temp = temp.replace(/\b10\b/, "10 (Plural of nouns beginning with NG)");
																temp = temp.replace(/\b11\b/, "11 (Abstract concept nouns and nouns beginning with LU)");
																temp = temp.replace(/\b12\b/, "12 (Diminutive nouns and nouns beginning with KA)");
																temp = temp.replace(/\b13\b/, "13 (Plural diminutive nouns and nouns beginning with KA)");
																temp = temp.replace(/\b14\b/, "14 (Collective nouns and nouns beginning with BU)");
																temp = temp.replace(/\b15\b/, "15 (Gerunds (Verbal nouns) and nouns beginning with KU)");
																temp = temp.replace(/\b16\b/, "16 (Locative Class for 'Ku')");
																temp = temp.replace(/\b17\b/, "17 (Locative Class for 'Mu')");
																temp = temp.replace(/\b18\b/, "18 (Locative Class for 'A')");
															}
															if(sty.match("#####")){
																res += sty.replaceAll("#####", temp);
															} else{
                                res += sty.replaceAll("###", temp.replace(quer, '<span class="highlight">$&</span>'));
															}
														}else{
                                res += temp + "<br />";
                            }
                        }
                    }
                    addEntry("" + res + "");

									//addEntry(row.join('</div><div class="col">'));
                }.bind({ counter: 0 }),
            });
        }
		}
    };

    const log = (...args) => logHtml("", ...args);
    const addEntry = (...args) => logHtml("entry", ...args);
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
                demo1(sqlite3, "chitonga.db.html", false, true);
            } catch (e) {
                error("Exception:", e.message);
            }
        });
})();
