/**
 * Created by noamc on 8/31/14.
 */
var express = require('express');
var app = express();

var binaryServer = require('binaryjs').BinaryServer;
var wav = require('wav');
var opener = require('opener');

var lame = require('lame');


var fs = require('fs');

if (!fs.existsSync("recordings"))
  fs.mkdirSync("recordings");

// var connect = require('connect');

// var serveStatic = require('serve-static');
app.use(express.static(__dirname + '/../public'));

var clients = [];

app.use("/listen", function(req, res) {

  res.writeHead(200, {
    'Content-Type': 'audio/mpeg',
    'Transfer-Encoding': 'chunked'
  });

  req.on("close", function() {
    var index = clients.indexOf(res);
    clients.splice(index, 1);
    console.log('request closed - remove response from global array');
    res.end();
  });

  clients.push(res);

  console.log('client connected - add response to global array!');
});

app.listen(3000);
console.log('listening on port 3000...')

// opener("http://localhost:8080");

var server = binaryServer({
  port: 9001
});

server.on('connection', function(client) {
  console.log("new connection...");
  var fileWriter = null;

  client.on('stream', function(stream, meta) {

    console.log("Stream Start@" + meta.sampleRate + "Hz");

    // var fileName = "recordings/" + new Date().getTime() + ".wav"

    // fileWriter = new wav.FileWriter(fileName, {
    //   channels: 1,
    //   sampleRate: meta.sampleRate,
    //   bitDepth: 16
    // });

    // stream.pipe(fileWriter);

    // client.on('close', function() {
    //   if (fileWriter != null) {
    //     fileWriter.end();
    //   }
    //   console.log("Connection Closed");
    // });
      console.log(meta);
      // stream.on('data', function(data) {
      //push data to all connected clients
      //todo fix delay
      console.log('on data');

      //so in theory, instead of writing to a file, I could write to an output stream
      var myStream = fs.createWriteStream('outputFromStream.mp3');

      var encoder = new lame.Encoder({
        channels: 2,
        bitDepth: 32,
        float: true,
        sampleRate: 44100,

        bitRate: 128,
        outSampleRate: 22050,
        mode: lame.MONO
      });

      stream.on('data', function(data) {
        stream.pipe(encoder);
        encoder.pipe(myStream);
      })
    //   stream.pipe(new lame.Encoder({
    //   // input 
    //   channels: 2, // 2 channels (left and right) 
    //   bitDepth: 32, // 16-bit samples 
    //   float: true,
    //     sampleRate: 44100, // 44,100 Hz sample rate 

    //   // // output 
    //   bitRate: 128,
    //   outSampleRate: 22050,
    //   mode: lame.MONO // STEREO (default), JOINTSTEREO, DUALCHANNEL or MONO 
    // }));

      stream.on('end', function() {
        console.log('done');
      });
      stream.on('close', function() {
        console.error('done!');
      });
    });


    // var encoder = new lame.Encoder({
    //   // input 
    //   channels: 2, // 2 channels (left and right) 
    //   bitDepth: 32, // 16-bit samples 
    //     sampleRate: 44100, // 44,100 Hz sample rate 

    //   // // output 
    //   bitRate: 128,
    //   outSampleRate: 22050,
    //   mode: lame.STEREO // STEREO (default), JOINTSTEREO, DUALCHANNEL or MONO 
    // });

    // encoder.on("data", function(data) {
    //   console.log('encoder');
    //   sendData(data);
    // });

    // var decoder = new lame.Decoder();

    // decoder.on('format', function(format) {
    //   console.log('decoder');
    //   decoder.pipe(encoder);
    // });

    // strea÷m.pipe(encoder);

    // stream.on('data', function(data) {
    //   //push data to all connected clients
    //   //todo fix delay
    //   console.log('on data');
    //   encoder.write(data);
    // });

    // var sendData = function(data) {
    //   console.log('send data to client before');
    //   clients.forEach(function(client) {
    //     console.log('send data to client');
    //     client.write(data);
    //   });
    // }

  });
