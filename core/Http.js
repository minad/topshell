exports._fetchThen = f => configuration => url => ({_run: (w, t, c) => {
    var options = {};
    for(var k in configuration) if(Object.prototype.hasOwnProperty.call(configuration, k)) {
        options[k.replace("_", "")] = configuration[k];
    }
    if(options.mode === "proxy") {
        url = "/proxy/" + encodeURI(url);
        delete options.mode;
    }
    var canceled = false;
    var controller = new AbortController();
    options.signal = controller.signal;
    try {
        fetch(url, options).then(response => {
            if(!canceled) {
                if(response.ok || options.check === false) {
                    try { return f(response).then(v => Promise.resolve(t(v))); } catch(e) { c(e) }
                } else {
                    c(new Error("HTTP error " + response.status + " on " + (options.method || "GET") + " " + url));
                }
            }
        }, e => {
            if(!canceled) c(e)
        });
    } catch(e) {
        c(e)
    }
    return () => {
        canceled = true;
        controller.abort();
    }
}});

exports.fetch_ = exports._fetchThen(r => Promise.resolve(r));

exports.fetchText_ = exports._fetchThen(r => r.text());
exports.fetchJson_ = exports._fetchThen(r => r.json().then(j => Promise.resolve(self.tsh.underscores(j))));
exports.fetchBytes_ = exports._fetchThen(r => r.arrayBuffer().then(b => Promise.resolve(new Uint8ClampedArray(b))));

exports._processResponse = f => response => ({_run: (w, t, c) => {
    var canceled = false;
    try {
        f(response).then(v => {
            if(!canceled) t(v)
        }, e => {
            if(!canceled) c(e)
        })
    } catch(e) {
        c(e)
    }
    return () => canceled = true;
}});

exports.text_ = exports._processResponse(r => r.text());
exports.json_ = exports._processResponse(r => r.json().then(j => Promise.resolve(self.tsh.underscores(j))));
exports.bytes_ = exports._processResponse(r => r.arrayBuffer().then(b => Promise.resolve(new Uint8ClampedArray(b))));

exports.header_ = header => response => response.headers.get(header);

exports.ok_ = response => response.ok;
exports.redirected_ = response => response.redirected;
exports.status_ = response => response.status;
exports.statusText_ = response => response.statusText;
exports.type_ = response => response.type;
exports.url_ = response => response.url;
