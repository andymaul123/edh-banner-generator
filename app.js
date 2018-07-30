var fse = require('fs-extra');
var jimp = require('jimp');
var rp = require('request-promise');

var cardArray;

readInputDirectory();

function readInputDirectory() {
    fse.readFile('./input/list.txt', 'utf8')
        .then((data) => {
            console.log("Reading list from local directory.");
            inputToArray(data);
            initJimp();
        })
        .catch((err) => {
            console.log(err);
        });
}

function inputToArray(input) {
  var list = String(input);
  list =  list.replace(/1x |1x/g,'');
  list = list.replace(/ /g,'+');
  cardArray = list.split('\n');
}

function initJimp() {
    console.log("Initializing JIMP.");
    var blankCanvas = new jimp(2048,842,0xFFFFFFFF).opacity(0);
    compositeImages(blankCanvas);
}

function compositeImages(startingImage) {
    console.log("Compositing images.");

    requestImageData("https://api.scryfall.com/cards/named?exact="+cardArray[0]+"&format=image")
        .then((response) => {
            var retrievedCardImage = new jimp(response, function(){});
            startingImage.composite(retrievedCardImage, getRandomInt(10)*100,getRandomInt(10)*100);
            cardArray.splice(0,1);
            if(cardArray.length) {
                compositeImages(startingImage);
            }
            else {
                finalizeImage(startingImage);
            }
        })
        .catch((err) => {
            console.log(err);
        });

}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function requestImageData(url) {
    var options = {
      uri: url,
      method: 'GET',
      encoding: null
    };
    return rp(options)
        .then((data) => {
          console.log("Image request successful.");
          return data;
        })
        .catch((err) => {
            console.log(err);
        });

}

function finalizeImage(finalImage) {
    console.log("Done compositing. Writing to output.");
    finalImage.write("./output/final.png");
}