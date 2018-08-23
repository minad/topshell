self.tsh = {};

self.tsh.symbols = {};

self.tsh.toHtml = value => {
    if(value === undefined) return {_tag: "span", children: ["Undefined"]};
    if(value === null) return {_tag: "span", children: ["Null"]};
    if(value._tag !== undefined) return value;
    if(value._run !== undefined) return {_tag: "span", children: ["Task"]};
    if(value instanceof Uint8ClampedArray) return {_tag: "span", children: ["Bytes"]};
    if(typeof value === 'string') return {_tag: "span", children: [JSON.stringify(value)]};
    if(typeof value === 'number') return {_tag: "span", children: [JSON.stringify(value)]};
    var result = [];
    if(Array.isArray(value)) {
        result.push("[");
        for(var i = 0; i < value.length; i++) {
            if(result.length > 1) result.push(", ");
            result.push(self.tsh.toHtml(value[i]));
        }
        result.push("]");
    } else {
        result.push("{");
        for(var k in value) if(Object.prototype.hasOwnProperty.call(value, k)) {
            if(result.length > 1) result.push(", ");
            result.push(k.replace("_", "") + ": ");
            result.push(self.tsh.toHtml(value[k]));
        }
        result.push("}");
    }
    return {_tag: "span", children: result};
};

self.tsh.record = (m, r) => {
    for(var k in r) {
        if(Object.prototype.hasOwnProperty.call(r, k) && !Object.prototype.hasOwnProperty.call(m, k)) m[k] = r[k];
    }
    return m;
};

self.tsh.taskThen = f => task => ({_run: (w, t, c) => {
    var cancel1 = null;
    try {
        var cancel2 = task._run(w, v => {
            try {
                if(cancel1 instanceof Function) cancel1();
                cancel1 = f(v)._run(w, t, c);
            } catch(e) {
                c(e)
            }
        }, c);
    } catch(e) {
        c(e);
    }
    return () => {
        if(cancel2 instanceof Function) cancel2();
        if(cancel1 instanceof Function) cancel1();
    };
}});

self.tsh.then = (m, f) => {
    if(Array.isArray(m)) {
        var result = [];
        for(var i = 0; i < r.length; i++) {
            var a = f(r[i]);
            for(var j = 0; j < a.length; j++) {
                result.push(a[j]);
            }
        }
        return result;
    } else if(m._run) {
        return self.tsh.taskThen(f)(m);
    } else {
        console.error("Operator <- not supported for: " + m);
        throw "Operator <- not supported for: " + m;
    }
};

self.tsh.loadImport = url => ({_run: (w, t, e) => {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = function() {
        if(xhr.status === 200) {
            var f = new Function('exports', xhr.responseText);
            var exported = {};
            f(exported);
            t(exported);
        } else {
            e('Could not load module');
        }
        //_d("${topImport.name}", {_tag: "span", children: ["Module ${topImport.url}"]}, _s.${topImport.name}_e);
    };
    xhr.send();
}});

self.tsh.setSymbols = (emit, newSymbols) => {

    let symbols = self.tsh.symbols;

    for(let name of Object.keys(symbols)) if(!newSymbols[name]) {
        if(symbols[name].cancel instanceof Function) symbols[name].cancel();
        delete symbols[name];
    }

    for(let name of Object.keys(newSymbols)) {
        if(symbols[name] && symbols[name].cancel instanceof Function) symbols[name].cancel();
        symbols[name] = newSymbols[name];
        if(symbols[name].error) emit(name, void 0, symbols[name].error);
    }

    function proceed(previousName) {
        if(previousName) for(let k of Object.keys(symbols)) if(symbols[k].dependencies.includes(previousName)) {
            if(symbols[k].cancel instanceof Function) symbols[k].cancel();
            symbols[k].cancel = null;
            symbols[k].computed = false;
            symbols[k].started = false;
            symbols[k].done = false;
        }

        for(let name of Object.keys(symbols)) {
            if(!symbols[name].started && symbols[name].error == null) {
                if(symbols[name].dependencies.every(d => symbols[d].done)) {
                    symbols[name].started = true;
                    try {
                        let result = symbols[name].compute(symbols);
                        symbols[name].computed = true;
                        if(symbols[name].run && result._run instanceof Function) {
                            symbols[name].cancel = result._run({}, v => {
                                symbols[name].done = true;
                                symbols[name].result = v;
                                emit(name, v, void 0);
                                proceed(name);
                            }, e => {
                                emit(name, void 0, e);
                            })
                        } else {
                            symbols[name].done = true;
                            symbols[name].result = result;
                            emit(name, symbols[name].result, void 0);
                            proceed(name);
                        }
                    } catch(e) {
                        emit(name, void 0, e);
                    }
                }
            }
        }
    }

    proceed();

};

importScripts("./target/scala-2.12/topshell-fastopt.js");
