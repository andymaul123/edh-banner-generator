# edh-banner-generator
A Node.js app to generate image banners for Magic the Gathering deck pages.
![Imgur](https://i.imgur.com/GiBlBnm.png)

# Prerequisites
Built on Node.js v8.9.3. NPM to install dependencies.

# Installation
`git clone git@github.com:andymaul123/edh-banner-generator.git`

Clone the repository.

`npm install`

Install modules/dependencies

`node app.js`

Run the program and generate a banner.

# Details
EDH-Banner-Generator creates a 2048x842 transparent .png file and writes it to the `./output` directory. In order to generate an image, it requires a file: `./input/list.txt`. See "Making a List" section below. Once the list has been parsed, the application will generate a new canvas and begin searching for the individual cards. EDH-Banner-Generator relies on Scryfall.com's wonderful REST API to fetch the card images, uses their `fuzzy` parameter to help with spelling mistakes, and pulls down a high-res png image.

After an image is downloaded it is saved to `./store/NAME.png`, where NAME is the name provided in your list.txt. Subsequent runs of the program will first search the store directory for a card's image before making a request to Scryfall. 

The first twelve cards are composited in a non-rotated format to consume the entire document space, preventing holes later on. This default behavior can be overridden with the Random flag (-r). Subsequent cards are then placed in one of four vertical 512x842 columns with a random angle of rotation and x,y coordinate modifier. Commander cards are placed perfectly centered in the image.

**Note:** A list of 30-35 cards provides enough material to generate a good-looking banner, and is the range I use for my own. YMMV.

# Making a List
The app requires a list.txt in a special format. It will read each line as a separate card, and currently ignores `1x` prefixes; all items are processed once, therefore any card designated with a prefix of more than 1 (e.g. 3x Island) will only fetch one of that entry. The following are all valid examples.

```
1x Swords to Plowshares
1x Sol Ring
3x Island
```

```
1xSwords to Plowshares
1xSol Ring
3xIsland
```

```
Swords to Plowshares
Sol Ring
Island
```

Each card entry may have a set designation using Scryfall's set codes. These must be placed inside parentheses like so:

```
Swords to Plowshares (EMA)
Sol Ring (g05)
Island (pgru)
```

Up to two entries may be suffixed with a `*` to denote commander status. Commanders are placed on top of all cards, horizontally and vertically centered.

`Dakkon Blackblade *`

**Note:** Cards are stored in `./store/` set agnostic. If you first retrieve and store a Guru Basic Island and want to later change it to an APAC Island, you will need to delete the image in store to force a new request.

Lastly, cards are treated with descending priority in your list. That means that the first entry will be composited *last*, and vice-versa. The exception is any cards marked as commander, which are removed from the normal priority lane. Cards more important should be reserved for the top portion of the list, and filler cards toward the bottom.

# Optional Flags
There are two optional flags.

`node app.js -b`

The **Background** flag will make a request to a manually-made background of card backs instead of an alpha transparency. This is useful if you have less than 12 cards in your list or just like the aesthetic and want to use it in conjunction with the Random flag.

`node app.js -r`

The **Random** flag will override the default behavior of hole-filling and cause every card without commander status to be randomly rotated.

# Performance
Please keep the following in mind:

Compositing images may cause spikes in CPU load. Most testing was done on Windows 10 with an Intel i5-7600k quad-core CPU @ 3.80GHz; CPU usage would be around the 30-40% mark during compositing.

Scryfall has an API rate limit of 10 requests per second.

Each image downloaded is roughly ~1.75mb. Final outputs are ~3.75mb. Ensure that your ISP and local disk space can accommodate the use of this app.