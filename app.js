/*
===================================================================================================
Constants + Variables
===================================================================================================
*/
const fse = require('fs-extra'),
      jimp = require('jimp'),
      rp = require('request-promise');

let cardsObj = {},
    count = 0;

/*
===================================================================================================
Functions
===================================================================================================
*/

readInputDirectory();

function readInputDirectory() {
    fse.readFile('./input/list.txt', 'utf8')
        .then((inputData) => {
            console.log("Reading list from local directory.");
            convertInputToObjects(inputData);
            initJimp();
        })
        .catch((err) => {
            console.log(err);
        });
}

function convertInputToObjects(input) {
    var list = String(input);
    list =  list.replace(/1x |1x/g,'');
    cardsObj.namesArray = list.split('\n');
    list = list.replace(/ /g,'+');
    cardsObj.uriArray = list.split('\n');
    cardsObj.namesArray = cardsObj.namesArray.filter(Boolean);
    cardsObj.uriArray = cardsObj.uriArray.filter(Boolean);
}

function initJimp() {
    console.log("Initializing JIMP.");
    var blankCanvas = new jimp(2048,842,0xFFFFFFFF).opacity(0);
    compositeImages(blankCanvas);
}

function compositeImages(startingImage) {
    retrieveStoredImageData()
        // .then((image) => {
        //     return image
        //         .scale(2)
        //         .rotate((Math.round(Math.random()) * 2 - 1) * getRandomInt(30))
        //         .resize(870,jimp.AUTO);
        // })
        // .then((editedImage) => {
        //     return startingImage.composite(editedImage,400*count,0);
        // })
        // .then((compositedImage) => {
        //     if(count <=9 && count < cardsObj.uriArray.length - 1) {
        //       count++;
        //         compositeImages(compositedImage);
        //     }
        //     else {
        //         finalizeImage(compositedImage);
        //     }
        // })
        .catch((err) => {
            console.log(err);
        });
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function retrieveStoredImageData() {
    console.log("./store/"+cardsObj.namesArray[count]+".png");
    return jimp.read("./store/"+cardsObj.namesArray[count]+".png")
        .catch((err) => {
            console.log("Failed to find image in storage. Accessing Scryfall API instead.");
            return requestImageFromAPI();
        });
}

function requestImageFromAPI() {
    var options = {
      uri: "https://api.scryfall.com/cards/named?exact="+cardsObj.uriArray[count]+"&format=image&version=png",
      method: 'GET',
      encoding: null
    };
    return rp(options)
        .then((data) => {
            console.log("Image request for: " + cardsObj.namesArray[count] + " successful.");
            return jimp.read(data)
            .then((image) => {
                var path = "./store/Dromar, the Banisher.png";
                image.write(path);
            })
            .catch((err) => {
                console.log(err);
            });
        })
        .catch((err) => {
            console.log(err);
        });

}

function finalizeImage(finalImage) {
    console.log("Done compositing. Writing to output.");
    finalImage.write("./output/final.png");
}