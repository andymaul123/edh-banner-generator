/*
===================================================================================================
Constants + Variables
===================================================================================================
*/
const fse = require('fs-extra'),
      jimp = require('jimp'),
      rp = require('request-promise'),
      argv = require('minimist')(process.argv.slice(2));


let cardsObj = [],
    count = 0,
    commanderCount = 0,
    partners = false;

/*
===================================================================================================
Main Functions
===================================================================================================
*/

readInputDirectory();

// Reads local file system for list.txt
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

// Initializes background image
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

// Core loop that composites images onto background image
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
            var rotation = getRandomInt(-30,30);
            if(cardsObj[count].commander) {
                rotation = 0;
            }
            return image
                .rotate(rotation)
                .resize(jimp.AUTO,postRotationScale(430,600,rotation));
        })
        .then((image) => {
            if(cardsObj[count].commander) {
                return startingImage.composite(image,commanderPlacement().x,commanderPlacement().y);
            } else {
                return startingImage.composite(image,cardPlacement().x,cardPlacement().y);
            }
        })
        .then((compositedImage) => {
            if(count <=9 && count < cardsObj.length - 1) {
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

// Core loop terminates here and outputs final version to local system
function finalizeImage(finalImage) {
    console.log("Done compositing. Writing to output.");
    finalImage.write("./output/final.png");
}

/*
===================================================================================================
Helper Functions
===================================================================================================
*/

// Processes input data into usable structure
function convertInputToObjects(input) {
    var list = String(input).replace(/1x |1x/g,'');
    var tempArray = list.split(/\n|\r/g);
    var item = {};
    var commanders = [];
    for (var i = tempArray.length - 1; i >= 0; i--) {
        item = {};
        item.set = tempArray[i].indexOf("(") > -1 ? tempArray[i].slice(tempArray[i].indexOf("(")+1,tempArray[i].indexOf(")")).trim() : "";
        item.commander = tempArray[i].indexOf("*") > -1 ? true : false;
        item.plainName = tempArray[i].replace(/\([^)]*\)|\*/g,'').trim();
        item.uri = item.plainName.replace(/ /g,'+');
        if(item.commander){
            commanders.push(item);
        } else {
            cardsObj.push(item);
        }
    }
    if(commanders.length >= 2) {
        partners = true;
    }
    cardsObj = cardsObj.concat(commanders);
    cardsObj.filter(Boolean);
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
// Determines placement for commanders
function commanderPlacement() {
    var coordsObj = {
        x:0,
        y:121
    };
    if(partners) {
        if(commanderCount == 0) {
            coordsObj.x = 594;
            commanderCount++;
        } else {
            coordsObj.x = 1024;
        }
    } else {
        coordsObj.x = 809;
    }
    return coordsObj;
}
// Determines card placement. Chooses horizontal section via modulus, then horizontal and vertical randomness
function cardPlacement() {
    var coordsObj = {
        x:0,
        y:0
    };
    coordsObj.x = getRandomInt((((count%4 +1) * 512) - 512),(count%4 +1) * 512);
    coordsObj.y = getRandomInt(-300,400);
    return coordsObj;
}
// Returns new card height after a rotation has been applied
function postRotationScale(width,height,rotation) {
    return Math.hypot(width,height)*(Math.sin(Math.atan(height/width)+Math.abs((rotation*(Math.PI/180)))));
}

// Returns random integer within range
function getRandomInt(min,max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// Returns locally cached image or calls requestImageFromAPI()
function retrieveStoredImageData() {
    console.log("Searching store for: "+cardsObj[count].plainName);
    return jimp.read("./store/"+cardsObj[count].plainName+".png")
        .catch((err) => {
            console.log("Failed to find image in storage. Accessing Scryfall API instead.");
            return requestImageFromAPI();
        });
}

// Returns image from Scryfall's API
function requestImageFromAPI() {
    var options = {
      uri: "https://api.scryfall.com/cards/named?exact="+cardsObj[count].uri+"&format=image&version=png&set="+cardsObj[count].set,
      method: 'GET',
      encoding: null
    };
    return rp(options)
        .then((data) => {
            console.log("Image request for: " + cardsObj[count].plainName + " successful.");
            return jimp.read(data)
            .then((image) => {
                return image.write("./store/"+cardsObj[count].plainName+".png");
            })
            .catch((err) => {
                console.log(err);
            });
        })
        .catch((err) => {
            console.log(err);
        });
}