exports.fromCodePoints_ = c => String.fromCodePoint.apply(String, c);
exports.toCodePoints_ = s => Array.from(s).map(c => c.codePointAt(0));
exports.join_ = s => a => a.join(s);
exports.padStart_ = n => c => s => s.padStart(n, c);
exports.padEnd_ = n => c => s => s.padEnd(n, c);
exports.repeat_ = n => s => s.repeat(n);
exports.replace_ = i => o => s => s.replace(i, o);
exports.startsWith_ = x => s => s.startsWith(x);
exports.endsWith_ = x => s => s.endsWith(x);
exports.split_ = x => s => s.split(x);
exports.at_ = i => s => s.charAt(i);
exports.size_ = s => s.length;
exports.includes_ = x => s => s.includes(x);
exports.slice_ = a => b => s => s.slice(a, b);
exports.take_ = i => s => s.slice(0, i);
exports.drop_ = i => s => s.slice(i);
exports.trim_ = s => s.trim();
exports.toUpper_ = s => s.toUpperCase();
exports.toLower_ = s => s.toLowerCase();
exports.toInt_ = i => parseInt(i, 10);
exports.fromInt_ = i => "" + i;
exports.toIntBase_ = b => i => parseInt(i, b);
exports.fromIntBase_ = b => i => i.toString(b);
