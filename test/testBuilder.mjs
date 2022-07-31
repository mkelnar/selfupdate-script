/* ********************************************************************************************************* *
 *
 * Copyright 2022 Michal Kelnar
 *
 * SPDX-License-Identifier: BSD-3-Clause
 * The BSD-3-Clause license for this file can be found in the LICENSE.txt file included with this distribution
 * or at https://spdx.org/licenses/BSD-3-Clause.html#licenseText
 *
 * ********************************************************************************************************* */
import {describe, it} from "mocha";
import * as assert from "assert";
import {exec} from "child_process";
import process, {cwd} from "process";

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
        assert.strictEqual(await execute(["--help"]), 20220200);
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
            (await runScript(process.cwd() + "/build/testScript.sh", ["--version"])).trim(),
            "testscript v1.0.0");
    });
});
