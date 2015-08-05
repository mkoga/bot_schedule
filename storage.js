var fs = require('fs');

var Storage = function(filepath) {
  this.filepath = filepath;
};

Storage.prototype.read = function() {
  if (fs.existsSync(this.filepath)) {
    var contents = fs.readFileSync(this.filepath).toString();
    return JSON.parse(contents);
  }
};

Storage.prototype.write = function(data) {
  fs.writeFileSync(this.filepath, JSON.stringify(data));
};

module.exports = Storage;
