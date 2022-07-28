/* ********************************************************************************************************* *
 *
 * Copyright 2022 Michal Kelnar
 *
 * SPDX-License-Identifier: BSD-3-Clause
 * The BSD-3-Clause license for this file can be found in the LICENSE.txt file included with this distribution
 * or at https://spdx.org/licenses/BSD-3-Clause.html#licenseText
 *
 * ********************************************************************************************************* */
import { describe, it, before, after} from "mocha"
import * as assert from "assert";
import * as process from "process";
import { exec } from 'child_process';
import { createServer } from "http";

async function execute($args) {
    if (!Array.isArray($args)) {
        $args = [$args];
    }
    return new Promise(($resolve, $reject) => {
        exec("./updater.sh " + $args.join(" "), {cwd: process.cwd() + "/src/bash", shell: "/bin/bash"}, ($error, $stdout, $stderr) => {
            if ($error) {
                $reject($error);
            } else if ($stderr.length > 0) {
                $reject(new Error($stderr));
            } else {
                $resolve($stdout);
            }
        })
    });
}

describe("Script", () => {
    let server;
    before(() => {
        server = createServer((req, res) => {
            if (req.url === "") {
                res.writeHead(404);
                res.end();
            } else {
                res.writeHead(200);
                res.end('Hello, World!');
            }
        });
        server.listen(8182);
    });
    after(() => {
        server.close()
    });

    it("version", async () => {
        assert.strictEqual((await execute(["sus-update", "--version"])).trim(), "20220200");
    });
    it("help", async () => {
        assert.strictEqual(await execute(["sus-update", "--help"]), "" +
            "Self update script utility is able to wrap custom script byt self updating feature from new content\n" +
            "Usage: {script-name} sus-update [options]\n" +
            "Options below are applicable only when sus-update sub-command is used for script invocation.\n" +
            "Any other invocation is directly redirected to custom script (TBD)\n" +
            "  -v|--version       Prints selfupdate-script version\n" +
            "  -h|--help          Prints selfupdate-script help\n" +
            "  --update-url=<>    Specify overwrite for internally defined update url\n" +
            "  --dry-run          Use this for validation purposes, it will do everything except download\n" +
            "                             from url (mocked copy of itself will be validated) and original script overwrite\n" +
            "  --force            Force do the script update without any user prompts.\n" +
            "  sus-update         Overwrite itself by new content\n");
    });
    it("update", async () => {
        assert.strictEqual((await execute(["sus-update", "--dry-run"]))
            .replace(/autoupdatescript-\d{10,}\.sh/g,"autoupdatescript-TIMESTAMP.sh"),
            "" +
            "**********  Automatic update of this executor script content starting  **********\n" +
            "TBD\n"+
            "Utility is executed in dry-run mode, this will only print steps without any modification\n" +
            "Download by curl from: https://hub.dev.oidis.io/Configuration/com-wui-framework-services/BaseInstallationRecipe/2019.0.0\n" +
            "Downloaded content: /tmp/autoupdatescript-TIMESTAMP.sh\n" +
            "New script downloaded: /tmp/autoupdatescript-TIMESTAMP.sh\n" +
            "Validate downloaded script: /tmp/autoupdatescript-TIMESTAMP.sh --version\n" +
            "20220200\n" +
            "Create backup into ./updater.sh.backup\n" +
            "Overwrite current file by downloaded script\n" +
            "Validate downloaded script: ./updater.sh --version\n" +
            "20220200\n" +
            "Script update succeed\n" +
            "Clean up before exit: 0\n")
    });
});
