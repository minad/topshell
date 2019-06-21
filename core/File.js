//: String -> Task String
exports.readText = path => self.tsh.action("File.readText")({path: path});
//: String -> String -> Task {}
exports.writeText = path => contents => self.tsh.action("File.writeText")({path: path, contents: contents});
//: String -> String -> Task {}
exports.appendText = path => contents => self.tsh.action("File.appendText")({path: path, contents: contents});
//: String -> Task Bytes
exports.readBytes = path => self.tsh.action("File.readBytes")({path: path}).map(self.tsh.fromHex);
//: String -> Bytes -> Task {}
exports.writeBytes = path => contents => self.tsh.action("File.writeBytes")({path: path, contents: self.tsh.toHex(contents)});
//: String -> Bytes -> Task {}
exports.appendBytes = path => contents => self.tsh.action("File.appendBytes")({path: path, contents: self.tsh.toHex(contents)});
//: String -> String -> Task {}
exports.copy = fromPath => toPath => self.tsh.action("File.copy")({path: fromPath, target: toPath});
//: String -> Task (List String)
exports.list = path => self.tsh.action("File.list")({path: path});
//: String -> Task (List {name: String, isFile: Bool, isDirectory: Bool})
exports.listStatus = path => self.tsh.action("File.listStatus")({path: path});
//: String -> Task {name: String, isFile: Bool, isDirectory: Bool}
exports.status = path => self.tsh.action("File.status")({path: path});
