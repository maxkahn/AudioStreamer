/**
 * Created by noamc on 8/31/14.
 */
var express = require('express');
var app = express();

var binaryServer = require('binaryjs').BinaryServer;
var wav = require('wav');
var opener = require('opener');
var rm = require('rimraf');
var ffmpeg = require('fluent-ffmpeg');
var binary = require('binary');

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

    //I believe the stream is a binary stream
    var binaryStream = binary(stream);

    //all I want to do for now is *test* the stream
      //to check its endianness how do I do that?

    //***VERSION WITH WAV***

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
      console.log('on data');
      var myStream = fs.createWriteStream('outputFromStream.mp3');

      var encoder = new lame.Encoder({
        //sample rate = frequency, bitrate = volume
        //input before I started comparing with wav input
        // channels: 2,
        // bitDepth: 32,
        // float: true,
        // sampleRate: 44100,
        channels: 2,
        bitDepth: 16, 
        // float: true,
        bitRate: 128,
        endianness: 'big',
        outSampleRate: 44100,
        // mode: lame.STEREO
      });


      //wondering if I even need the data cb?
      //this line should just work
        // stream.pipe(encoder);
        // encoder.pipe(myStream);

    //new attempt to nest stream, encoder, and data
      stream.on('data', function(data) {
        encoder.write(data, function() {
          encoder.on('data', function(data) {
            myStream.write(data);
          });
        });
      });

      stream.on('end', function() {
        console.log('done');
        myStream.end();
      });
      stream.on('close', function() {
        console.error('done!');
        myStream.end();
      });
    });

  });


//from mido22's recordOpus app
  //what kind of objects are inFile and outFile
var audioConcat = function(inFile, outFile, callback) {
  try {
    ffmpeg().input(inFile)
      .inputOptions('-f', 'concat')
      .output(outFile)
      .on('error', function(err) {
        console.log('err: ', err);
        callback(err);
      })
      .on('end', function() {
        callback(null, outFile);
      })
      .run();
  }

  catch(e) {
    console.log('err: ', e);
    callback(e);
  }
};

//from mido22's recordOpus app
  //data is a piece of audio buffer
  //assumes client-side browser !== FireFox
var saveAudio = function(data, callback) {
  //mido22 has a first call to appendFile
    //I think that's just for the file name, and I'll ignore that
  data.path = 'temp' + data.uid;
  fs.appendFile('outputFromStream.mp3', data.blob, function(err) {
    if (err) {
      console.log(err);
      return;
    }
    if (data.stop) {
      //I may have confused these two files
      var outFile = 'outputFromStream.mp3';
      var inFile = data.path;
      concat(inFile, outFile, function(err, filepath) {
        rm(data.path, function(err) {
          if (err) {
            console.log('err: ', err);
          }
        });
        returnLink(data, filepath, callback);
      })
    }
  })
};

var returnLink = function(data, filepath, callback) {
  data.path = filepath;
  delete data.blob;
  callback(data);
};