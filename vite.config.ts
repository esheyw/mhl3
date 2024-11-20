import * as os from "os";
import * as fs from "fs/promises";
import * as Vite from "vite";
import { checker } from "vite-plugin-checker";
import { viteStaticCopy } from "vite-plugin-static-copy";
import tsconfigPaths from "vite-tsconfig-paths";
import * as path from "path";
import esbuild from "esbuild";

type PackageType = "module" | "system" | "world";

const packageType: PackageType = "module";

// The package name should be the same as the name in the `module.json`/`system.json` file.
const packageID: string = "mhl3";

const filesToCopy = [
  `${packageType}.json`,
  "CHANGELOG.md",
  "README.md",
  "CONTRIBUTING.md",
  "styles/!(*.scss|*.less)",
  // "styles/**/!(*.scss|*.less)",
  "lang/*.json",
  "templates/*.(hbs|html)",
  "templates/**/*.(hbs|html)",
]; // Feel free to change me.

// @ts-expect-error the types are set to invalid values to ensure the user sets them.
// eslint-disable-next-line
if (packageType == "REPLACE ME" || packageID == "REPLACE ME") {
  throw new Error(
    `Must set the "packageType" and the "packageID" variables in vite.config.ts`,
  );
}

const foundryHost = await findFoundryHost();

const config = Vite.defineConfig(({ command, mode }): Vite.UserConfig => {
  const buildMode = mode === "production" ? "production" : "development";
  const outDir = "dist";

  const plugins: Vite.Plugin[] = [
    checker({ typescript: { buildMode: true } }),
    tsconfigPaths(),
  ];

  // Handle minification after build to allow for tree-shaking and whitespace minification
  // "Note the build.minify option does not minify whitespaces when using the 'es' format in lib mode, as it removes
  // pure annotations and breaks tree-shaking."
  if (buildMode === "production") {
    plugins.push(
      minifyPlugin(),
      ...viteStaticCopy({
        targets: filesToCopy.map((file) => ({
          src: file,
          dest: path.dirname(file),
        })),
      }),
    );
  } else {
    plugins.push(foundryHMRPlugin());
  }

  const foundryPackagePath = getFoundryPackagePath(packageType, packageID);

  const proxyKey = `^(?!/${escapeRegExp(foundryPackagePath)})`;
  console.log(proxyKey);

  return {
    test: {
      typecheck: {
        enabled: true,
        tsconfig: "./tests/tsconfig.json",
      },
    },
    base: command === "build" ? "/" : `/${foundryPackagePath}`,
    publicDir: "static",
    build: {
      outDir,
      minify: true,
      sourcemap: true, // buildMode === "development",
      lib: {
        name: packageID,
        entry: "src/init.ts",
        formats: ["es"],
        fileName: packageID,
      },
      target: "es2023",
    },
    optimizeDeps: {
      entries: [],
    },
    server: {
      port: 30037,
      open: mode === "test" ? false : "/game",
      proxy: {
        [proxyKey]: `http://${foundryHost}`,
        "/socket.io": {
          target: `ws://${foundryHost}`,
          ws: true,
        },
      },
    },
    plugins,
  };
});

// Credit to PF2e's vite.config.ts for this https://github.com/foundryvtt/pf2e/blob/master/vite.config.ts
function minifyPlugin(): Vite.Plugin {
  return {
    name: "minify",
    config() {
      return { build: { minify: false } };
    },
    renderChunk: {
      order: "post",
      async handler(code, chunk) {
        return chunk.fileName.endsWith(".mjs")
          ? esbuild.transform(code, {
              keepNames: true,
              minifyIdentifiers: false,
              minifySyntax: true,
              minifyWhitespace: true,
            })
          : code;
      },
    },
  };
}

function getFoundryPackagePath(packageType: PackageType, packageID: string) {
  // Foundry puts a package at the path `/modules/module-name`, `/systems/system-name`, or `/worlds/world-name`.
  return `${packageType}s/${packageID}/`;
}

async function findFoundryHost(): Promise<string> {
  const foundryHostNameEnv = process.env.FOUNDRY_HOST_NAME;
  const hasHostEnv = foundryHostNameEnv != null;
  const foundryHost = foundryHostNameEnv ?? "localhost";

  let foundryPort: number;
  const envPortString = process.env.FOUNDRY_PORT;
  if (envPortString != null) {
    if (!/[0-9]+/.test(envPortString)) {
      throw new Error(
        `Expected FOUNDRY_PORT to be a number, got ${JSON.stringify(envPortString)}.`,
      );
    }

    foundryPort = Number.parseInt(envPortString, 10);
  } else {
    foundryPort = 30000;
  }

  const pingResult = await ping(foundryHost, foundryPort);
  if (pingResult.error == null) {
    return pingResult.host;
  }

  const foundryNotRuning =
    "If Foundry is not running please start it. Otherwise if Foundry is running on a custom address set FOUNDRY_HOST_NAME/FOUNDRY_PORT.";

  // If the environment variable in WSL isn't set also try reaching the host through Windows.
  if (!hasHostEnv && (await isWSL())) {
    // The default host of localhost won't work on WSL if the server is running on Windows.
    // Reaching Windows is possible through `${hostname}.local`.
    const hostname = os.hostname();

    const wslToWindowsPingResult = await ping(`${hostname}.local`, foundryPort);
    if (wslToWindowsPingResult.error == null) {
      return wslToWindowsPingResult.host;
    }

    throw new Error(
      `Could not ping localhost:${foundryPort} (WSL) or $(hostname).local (Windows)
${foundryNotRuning}
WSL Error - ${formatError(pingResult.error)}
Windows Error - ${formatError(wslToWindowsPingResult.error)}`,
    );
  }

  throw new Error(
    `Could not ping localhost:${foundryPort}
${foundryNotRuning}
Error: ${pingResult.error.message}`,
  );
}

type PingResult =
  | { host: string; error?: never }
  | { host?: never; error: Error };

async function ping(hostName: string, port: number): Promise<PingResult> {
  if (!Number.isInteger(port)) {
    return {
      error: new Error(`Port must be a valid integer got ${port}`),
    };
  }

  if (port < 0 || port > 65535) {
    return {
      error: new Error(`Port must be between 0 and 65535, got ${port}`),
    };
  }

  const host = `${hostName}:${port}`;

  try {
    const response = await fetch(`http://${host}`, { method: "OPTIONS" });
    await response.body?.cancel("Body not needed");
  } catch (error) {
    return { error: toError(error) };
  }

  return { host: `${hostName}:${port}` };
}

// Since anything can be thrown, e.g `throw 1`, this function ensures it's an instance of `Error`.
function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(formatError(error));
}

function formatError(error: unknown): string {
  if (!(error instanceof Error)) {
    // @ts-expect-error if `toString` fails there's nothing to do anyways
    // eslint-disable-next-line
    return error.toString();
  }

  if (error.cause != null) {
    // If `toString` fails there's nothing to do anyways
    // eslint-disable-next-line
    return `${error.toString()}, cause = ${error.cause.toString()}`;
  }

  return error.toString();
}

// A cached value of whether the current environment is WSL
let _isWSL: boolean | undefined = undefined;

async function isWSL(): Promise<boolean> {
  if (_isWSL != null) {
    return _isWSL;
  }

  // Checking for the WSLInterop file seems to be the way that the ecosystem has settled on to check if the system is running WSL.
  // See for example: https://github.com/canonical/snapd/blob/37eb0a311917af15622237db10011d9c62e8cb12/release/release.go#L151
  try {
    await fs.access("/proc/sys/fs/binfmt_misc/WSLInterop", fs.constants.F_OK);

    _isWSL = true;

    return _isWSL;
  } catch (_e) {
    // Ignore this error. It just means that the file doesn't exist but there's a fallback to check next.
  }

  try {
    await fs.access("/run/WSL", fs.constants.F_OK);

    _isWSL = true;
  } catch (_e) {
    _isWSL = false;
  }

  return _isWSL;
}

// Escapes all RegExp meta-characters like .
function escapeRegExp(unescaped: string): string {
  return unescaped.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function foundryHMRPlugin(): Vite.Plugin {
  // Vite HMR is only preconfigured for css files: add handler for HBS templates
  return {
    name: "hmr-handler",
    apply: "serve",
    async handleHotUpdate(context) {
      const { outDir } = context.server.config.build;

      if (context.file.startsWith(outDir)) return;

      const baseName = path.basename(context.file);
      const extension = path.extname(context.file);

      if (baseName === "en.json") {
        const basePath = context.file.slice(context.file.indexOf("lang/"));
        console.log(`Updating lang file at ${basePath}`);

        await fs.copyFile(context.file, `${outDir}/${basePath}`);

        const sendPath =
          getFoundryPackagePath(packageType, packageID) + basePath;
        console.log("send path: ", sendPath);

        context.server.ws.send({
          type: "custom",
          event: "lang-update",
          data: {
            path: sendPath,
          },
        });

        return;
      }

      if (extension === ".hbs") {
        const basePath = context.file.slice(context.file.indexOf("templates/"));
        console.log(`Updating template file at ${basePath}`);

        await fs.copyFile(context.file, `${outDir}/${basePath}`);

        const sendPath =
          getFoundryPackagePath(packageType, packageID) + basePath;
        console.log("send path: ", sendPath);

        context.server.ws.send({
          type: "custom",
          event: "template-update",
          data: {
            path: sendPath,
          },
        });

        return;
      }
    },
  };
}

export default config;
