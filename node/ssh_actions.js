var fs = require('fs');
var child_process = require('child_process');

module.exports = {
    'File.readText': (json, context, callback) => {
        execFile(context.ssh, json.config, "cat", [json.path], "", (error, result) => {
            if(error == null) callback(void 0, result.out);
            else callback(error, result);
        });
    },
    'File.writeText': (json, context, callback) => {
        execFile(context.ssh, json.config, "dd", ["of=" + json.path], json.contents, (error, result) => {
            if(error == null) callback(void 0, "");
            else callback(error, result);
        });
    },
    'File.list': (json, context, callback) => {
        execFile(context.ssh, json.config, "ls", [json.path], "", (error, result) => {
            if(error == null) callback(void 0, result.out.split("\n"));
            else callback(error, result);
        });
    },
    'File.listStatus': (json, context, callback) => {
        execFile(context.ssh, json.config, "ls", ["--almost-all", "--escape", "--quote", "--file-type", json.path], "", (error, result) => {
            function parse(f) {
                // TODO: JSON.parse isn't quite the right parser here
                if(f.endsWith("\"")) return {name: JSON.parse(f), isFile: true, isDirectory: false};
                else return {name: JSON.parse(f.slice(0, -1)), isFile: false, isDirectory: f.slice(-1) === "/"};
            }
            if(error == null) callback(void 0, result.out.split("\n").filter(s => s.length !== 0).map(parse));
            else callback(error, result);
        });
    },
    'File.status': (json, context, callback) => {
        execFile(context.ssh, json.config, "ls", ["--almost-all", "--escape", "--quote", "--file-type", "--directory", json.path], "", (error, result) => {
            function parse(f) {
                // TODO: JSON.parse isn't quite the right parser here
                if(f.endsWith("\"")) return {name: JSON.parse(f), isFile: true, isDirectory: false};
                else return {name: JSON.parse(f.slice(0, -1)), isFile: false, isDirectory: f.slice(-1) === "/"};
            }
            if(error == null) callback(void 0, result.out.split("\n").filter(s => s.length !== 0).map(parse)[0]);
            else callback(error, result);
        });
    },
    'Process.run': (json, context, callback) => {
        execFile(context.ssh, json.config, json.path, json.arguments, json.config.in || "", callback);
    },
    'Process.shell': (json, context, callback) => {
        var arguments = ["-o", "BatchMode yes", context.ssh.user + "@" + context.ssh.host, json.command];
        let child = child_process.execFile("ssh", arguments, json.config, (error, stdout, stderr) => {
            if(json.config.check !== false) callback(error, {out: stdout, error: stderr});
            else callback(void 0, {out: stdout, error: stderr, problem: error.message, code: error.code, killed: error.killed, signal: error.signal});
        });
        child.stdin.end(json.config.in || "");
    },
};



function execFile(ssh, config, path, arguments, stdin, callback) {
    config = config || {};
    let escape = a => "'" + a.replace(/'/g, "'\\''") + "'";
    let command = [path].concat(arguments).map(a => escape(a)).join(" ");
    let newArguments = ["-o", "BatchMode yes", ssh.user + "@" + ssh.host, command];
    let child = child_process.execFile("ssh", newArguments, config, (error, stdout, stderr) => {
        if(config.check !== false) callback(error, {out: stdout, error: stderr});
        else callback(void 0, {out: stdout, error: stderr, problem: error.message, code: error.code, killed: error.killed, signal: error.signal});
    });
    child.stdin.end(stdin);
}
