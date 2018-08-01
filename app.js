/*
===================================================================================================
Constants + Variables
===================================================================================================
*/
const fse = require('fs-extra'),
      jimp = require('jimp'),
      rp = require('request-promise'),
      argv = require('minimist')(process.argv.slice(2));


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
    list =  list.replace(/\r/g,'');
    cardsObj.namesArray = list.split('\n');
    list = list.replace(/ /g,'+');
    cardsObj.uriArray = list.split('\n');
    cardsObj.namesArray = cardsObj.namesArray.filter(Boolean);
    cardsObj.uriArray = cardsObj.uriArray.filter(Boolean);
}

function initJimp() {
    console.log("Initializing JIMP.");
    if(argv.b) {
        console.log("Background flag found. Will load default card back collage.");
        jimp.read("https://i.imgur.com/ohgmxw0.jpg")
            .then(compositeImages)
            .catch((err) => {
                console.log(err);
            });
    } else {
        console.log("No background flag found (-b). Will create transparent background.");
        var blankCanvas = new jimp(2048,842,0xFFFFFFFF).opacity(0);
        compositeImages(blankCanvas);
    }
}

function compositeImages(startingImage) {
    retrieveStoredImageData()
        .then((image) => {
            return image
                .scale(2);
        })
        .then((image) => {
            return dropShadow.call(image, 10, 10, 10, 0.6)
        })
        .then((image) => {
            var rotation = (Math.round(Math.random()) * 2 - 1) * getRandomInt(30);
            return image
                .rotate(rotation)
                .resize(jimp.AUTO,postRotationScale(430,600,rotation));
        })
        .then((image) => {
            return startingImage.composite(image,400*count,0);
        })
        .then((compositedImage) => {
            if(count <=9 && count < cardsObj.uriArray.length - 1) {
              count++;
                compositeImages(compositedImage);
            }
            else {
                finalizeImage(compositedImage);
            }
        })
        .catch((err) => {
            console.log(err);
        });
}

// Adds drop shadow - taken straight from test examples
function dropShadow(x, y, b, a) {
    var img = new jimp(this.bitmap.width + Math.abs(x*2) + (b*2), this.bitmap.height + Math.abs(y*2) + (b*2));
    var orig = this.clone();
    this.scan(0, 0, this.bitmap.width, this.bitmap.height, function (x, y, idx) {
        this.bitmap.data[ idx + 0 ] = 0;
        this.bitmap.data[ idx + 1 ] = 0;
        this.bitmap.data[ idx + 2 ] = 0;
        this.bitmap.data[ idx + 3 ] = this.bitmap.data[ idx + 3 ] * a;
    });
    
    var x1 = Math.max(x * -1, 0) + b;
    var y1 = Math.max(y * -1, 0) + b;
    img.composite(this, x1, y1);
    img.blur(b);
    img.composite(orig, x1 - x, y1 - y);
    return img;
}

// Returns new card height after a rotation has been applied
function postRotationScale(width,height,rotation) {
    return Math.hypot(width,height)*(Math.sin(Math.atan(height/width)+Math.abs((rotation*(Math.PI/180)))));
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function retrieveStoredImageData() {
    console.log("Searching store for: "+cardsObj.namesArray[count]);
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
                return image.write("./store/"+cardsObj.namesArray[count]+".png");
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