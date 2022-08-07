/* ********************************************************************************************************* *
 *
 * Copyright 2022 Michal Kelnar
 *
 * SPDX-License-Identifier: BSD-3-Clause
 * The BSD-3-Clause license for this file can be found in the LICENSE.txt file included with this distribution
 * or at https://spdx.org/licenses/BSD-3-Clause.html#licenseText
 *
 * ********************************************************************************************************* */

import * as fs from "fs";
import * as path from "path";
import * as process from "process";
import * as console from "console";
import {Command} from 'commander';

const program = new Command();
// specify also default values for each opts (if it makes sense) to reduce need of is-null checks in code
const projectRoot = process.argv[1].replace("/src/js/index.mjs", "");
program
    .name("selfupdate-script")
    .version("" + process.env.npm_package_version, "-v, --version")
    .description(
        "This utility takes specified script from argument path and embed it into\n" +
        "selfupdate-script content. Newly created script at output path or in ./build\n" +
        "subfolder when called from module root directory is capable to invoke code\n" +
        "from original one. However, when 'sus-update' argument is specified then\n" +
        "selfupdate from online source will be invoked.")
    .argument("<path>", "Script to be embedded into selfupdate-script")
    .option("--update-url <url>", "Specify new URL for script update (will be embedded into script).", "")
    .option("--update-version <version>", "Specify new version of script.", "")
    .option("--out <out>", "Select output location, accepts directory (original script name will be appended) or file path.", "")
    .action(($script, $options) => {
        if (!fs.existsSync($script)) {
            console.error("Script path not exists: " + $script);
            return;
        } else if (fs.statSync($script).isDirectory()) {
            console.error("Script argument points to directory instead of file: " + $script);
            return;
        }
        let scriptFileName = path.basename($script);
        let output = $options.out;
        if (output && (fs.existsSync(output) || fs.existsSync(path.dirname(output)))) {
            if (fs.existsSync(output) && fs.statSync(output).isDirectory()) {
                output += "/" + scriptFileName;
            }
        } else {
            fs.rmSync(projectRoot + "/build", {force: true, recursive: true});
            fs.mkdirSync(projectRoot + "/build");
            output = projectRoot + "/build/" + scriptFileName;
        }
        let embed = fs.readFileSync($script).toString();
        let script = fs.readFileSync(projectRoot + "/src/scripts/updater.sh").toString();

        if($options.updateVersion){
            script = script.replace(/^version=.*$/m, "version=" + $options.updateVersion);
        }
        if ($options.updateUrl) {
            try {
                new URL($options.updateUrl);
            } catch {
                console.error("WARNING: Specified URL is invalid: " + $options.updateUrl);
            }
            script = script.replace(/^updateUrl=".*"$/m, "updateUrl=\"" + $options.updateUrl + "\"");
        }

        const startKey = "  ## BEGIN - selfupdate-script embedded content";
        const stopKey = "  ## END - selfupdate-script embedded content";
        let start = script.indexOf(startKey);
        let stop = script.indexOf(stopKey);

        script =
            script.substring(0, start) +
            startKey + "\n" +
            embed + "\n" +
            script.substring(stop);

        fs.writeFileSync(output, script, {encoding: "utf8", mode: 0o755});  // => chmod +x

        console.log("selfupdate-script has been created: " + output);
    });

// TODO(mkelnar) add better error handling for commander issues -> stop processing
program.showSuggestionAfterError(true);
program.parse();
