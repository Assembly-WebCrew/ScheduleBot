var JSONStream = require('JSONStream');

function Logger(out) {
  this.stream = out;
  this.json = new JSONStream();
}

Logger.prototype.write = function (data) {
  this.json.write(data);
  this.stream.pipe(this.json);
};