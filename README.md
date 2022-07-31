# selfupdate-script
 > Selfupdate container for various shell scripts.

## Description
Selfupdate script container is able to update itself from some online source (HTTPS is highly recommended). After execution with 
reserved sub-command keyword "sus-update" (Self-Update Script - SUS) this container downloads single file from specified URL
(embedded inside SUS or specified by "--update-url=*" option) and replace itself with new content.
Original file will be overwritten only when download and validation succeed ("--version" option is used for integrity validation).

### Selfupdate-script
Main container "./src/bash/updater.sh" contains several functions for internal use and one which holds embedded script 
content "embeddedScript()". This function body could be replaced by custom script content manually or by prepared NPM module.
Both "BEGIN" and "END" comment marks are in SUS only to identify content to replace by builder.

```shell
function embeddedScript() {
  ## BEGIN - selfupdate-script embedded content
  echo "Invocation of embedded script: $@"
  ## END - selfupdate-script embedded content
}
```

There are no known restriction for script content which could be embedded, yet.

### Builder
Notwithstanding the manual selfupdate-script edit is simple, there is also builder prepared as basic NPM module mostly for testing
and CI/CD purposes.
You will need [Node.js](https://nodejs.org) installed on your machine and added into search path inside your ENV (at least in IDE).

```shell
git clone https://github.com/mkelnar/selfupdate-script.git
cd selfupdate-script

# optional path export, you can download and place Node.js into "dependencies/nodejs" folder inside this project
export PATH=<nodejs-bin>:$PATH

npm install
npm test

# process script generation by NPM
npm start -- test/resources/testScript.sh
npm start -- --out=output.sh test/resources/testScript.sh

# or node directly
node src/js/index.mjs test/resources/testScript.sh
node src/js/index.mjs --out=output.sh test/resources/testScript.sh
```


## License

This software is owned or controlled by Michal Kelnar.
The use of this software is governed by the BSD-3-Clause Licence distributed with this material.

See the `LICENSE.txt` file for more details.

--

Author Michal Kelnar,
Copyright 2022 Michal Kelnar
