/* ********************************************************************************************************* *
 *
 * Copyright 2022 Michal Kelnar
 *
 * SPDX-License-Identifier: BSD-3-Clause
 * The BSD-3-Clause license for this file can be found in the LICENSE.txt file included with this distribution
 * or at https://spdx.org/licenses/BSD-3-Clause.html#licenseText
 *
 * ********************************************************************************************************* */
import {before, describe, it} from "mocha";
import * as assert from "assert";
import {exec} from "child_process";

async function execute($args, $cwd) {
    if (!Array.isArray($args)) {
        $args = [$args];
    }
    if (!$cwd) {
        $cwd = process.cwd() + "/src/js";
    }
    return new Promise((resolve, reject) => {
        exec("node index.mjs " + $args.join(" "), {cwd: $cwd, shell: "/bin/bash"}, ($error, $stdout, $stderr) => {
            resolve($stdout + $stderr);
        });
    });
}

async function runScript($path, $args) {
    if (!Array.isArray($args)) {
        $args = [$args];
    }
    return new Promise((resolve) => {
        exec($path + " " + $args.join(" "), {shell: "/bin/bash"}, ($error, $stdout, $stderr) => {
            resolve($stdout + $stderr);
        });
    });
}

describe("Builder", () => {
    before(() => {
        if (!process.env.npm_package_version) {
            process.env.npm_package_version = "0.0.0";
        }
    });
    it("version", async () => {
        assert.strictEqual((await execute(["--version"])).trim(), process.env.npm_package_version);
        assert.strictEqual((await execute(["-v"])).trim(), process.env.npm_package_version);
    });

    it("help", async () => {
        assert.strictEqual(await execute(["--help"]),
            "Usage: selfupdate-script [options] <path>\n\n" +
            "This utility takes specified script from argument path and embed it into\n" +
            "selfupdate-script content. Newly created script at output path or in ./build\n" +
            "subfolder when called from module root directory is capable to invoke code\n" +
            "from original one. However, when 'sus-update' argument is specified then\n" +
            "selfupdate from online source will be invoked.\n\n" +
            "Arguments:\n" +
            "  path                        Script to be embedded into selfupdate-script\n\n" +
            "Options:\n" +
            "  -v, --version               output the version number\n" +
            "  --update-url <url>          Specify new URL for script update (will be\n" +
            "                              embedded into script). (default: \"\")\n" +
            "  --update-version <version>  Specify new version of script. (default: \"\")\n" +
            "  --out <out>                 Select output location, accepts directory\n" +
            "                              (original script name will be appended) or file\n" +
            "                              path. (default: \"\")\n" +
            "  -h, --help                  display help for command\n");
    });

    it("invalid-argument", async () => {
        assert.strictEqual((await execute([""])).trim(), "error: missing required argument 'path'");
        assert.strictEqual((await execute(["unknown"])).trim(), "Script path not exists: unknown");
        assert.strictEqual((await execute(["./test/resources/none.sh"])).trim(), "Script path not exists: ./test/resources/none.sh");
    });

    it("script", async () => {
        // path shifted by execute()!
        assert.strictEqual(
            (await execute(["../../test/resources/testScript.sh"])).trim(),
            "selfupdate-script has been created: " + process.cwd() + "/build/testScript.sh");

        assert.strictEqual(
            (await runScript(process.cwd() + "/build/testScript.sh", ["sus-update", "--version"])).trim(),
            "20220200");

        assert.strictEqual(
            (await runScript(process.cwd() + "/build/testScript.sh", ["sus-update", "--get-url"])).trim(),
            "https://hub.dev.oidis.io/Configuration/com-wui-framework-services/BaseInstallationRecipe/2019.0.0");

        assert.strictEqual(
            (await runScript(process.cwd() + "/build/testScript.sh", ["--version"])).trim(),
            "testscript v1.0.0");
    });

    it("update-url-arg", async () => {
        // path shifted by execute()!
        assert.strictEqual(
            (await execute([
                "../../test/resources/testScript.sh",
                "--update-url=https://whatever.what/script",
                "--update-version=123.456.666"])).trim(),
            "selfupdate-script has been created: " + process.cwd() + "/build/testScript.sh");

        assert.strictEqual(
            (await runScript(process.cwd() + "/build/testScript.sh", ["sus-update", "--get-url"])).trim(),
            "https://whatever.what/script");
        assert.strictEqual(
            (await runScript(process.cwd() + "/build/testScript.sh", ["sus-update", "--version"])).trim(),
            "123.456.666");
    });
});
