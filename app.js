var fs = require('fs');
var jimp = require('jimp');
var rp = require('request-promise');



readInputDirectory();


function inputToArray(input) {
  var list = String(input);
  list =  list.replace(/1x |1x/g,'');
  list = list.replace(/ /g,'+');
  return list.split('\n');
}

function readInputDirectory() {
    fs.readFile('./input/list.txt', 'utf8', (err, data) => {
        if (err) throw err;
        console.log(inputToArray(data));
        requestImagesFromEndpoint(inputToArray(data));
    });
}

function requestImageData(url) {
rp(url)
    .then(function (data) {
        sendImageToJimp(JSON.parse(data));
        // console.log(JSON.parse(data));
    })
    .catch(function (err) {
        // Crawling failed...
    });

}

function sendImageToJimp(cardJSON) {
    jimp.read(cardJSON.image_uris.large, function (err, image) {
        if (err) throw err;
        image.resize(256, 256)
             .quality(60)
             .greyscale()
             .write("./output/test.jpg");
    });
}


function requestImagesFromEndpoint(arrayOfCardNames) {
    for (var i = arrayOfCardNames.length - 1; i >= 0; i--) {
        requestImageData("https://api.scryfall.com/cards/named\?exact\="+arrayOfCardNames[i]);
    }
}










