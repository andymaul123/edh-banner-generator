var fse = require('fs-extra');
var jimp = require('jimp');
var rp = require('request-promise');

var cardsObj = {};
var count = 0;

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
  cardsObj.namesArray = list.split('\n');
  list = list.replace(/ /g,'+');
  cardsObj.uriArray = list.split('\n');
}

function initJimp() {
    console.log("Initializing JIMP.");
    var blankCanvas = new jimp(2048,842,0xFFFFFFFF).opacity(0);
    compositeImages(blankCanvas);
}

function compositeImages(startingImage) {
    console.log("Compositing images.");

    requestImageData("https://api.scryfall.com/cards/named?exact="+cardsObj.uriArray[count]+"&format=image")
        .then((response) => {
            var retrievedCardImage = new jimp(response, function(){});
            startingImage.composite(retrievedCardImage, getRandomInt(10)*100,getRandomInt(10)*100);
            count++;
            if(count <=9 && count <= cardsObj.uriArray.length - 1) {
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
          console.log("Image request for: " + cardsObj.namesArray[count] + " successful.");
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