var lame = require('lame');

// create the Encoder instance
var decoder = new lame.Decoder();

//mp3 data in
process.stdin.pipe(decoder);

//raw stream out
decoder.pipe(process.stdout);

//I *hope* this file does nothing but takes an mp3 file and returns a stream
//for testing purposes