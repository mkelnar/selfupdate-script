import { describe, it } from "mocha"
import * as assert from "assert";
import { exec } from 'child_process';
import { createServer } from "http";

async function execute($args) {
    if (!Array.isArray($args)) {
        $args = [$args];
    }
    return new Promise(($resolve, $reject) => {
        exec("./updater.sh " + $args.join(" "), {cwd: process.cwd() + "/src", shell: "/bin/bash"}, ($error, $stdout, $stderr) => {
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

describe("test", () => {
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
        assert.strictEqual(await execute(["--version"]), 20220200);
    });
    it("help", async () => {
        assert.strictEqual(await execute(["--help"]), "" +
            "This is simple wrapper for docker compose to simplify invocation from this base overrides.\n" +
            "  start            Starts service\n" +
            "  stop             Stops service and remove orphans\n" +
            "  pull             Pull images\n" +
            "  restart          Do the shallow restart\n" +
            "  -v|--version     Print version\n" +
            "  -h|--help        Print help\n" +
            "  -f=*, --file=*   Specify docker compose file. Note that this could be already specified in wrapping script.\n");
    });
    it("update", async () => {
        assert.strictEqual(await execute(["update", "--dry-run"]), "")
    });
});
