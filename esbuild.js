import esbuild from "esbuild";
import { GasPlugin } from "esbuild-gas-plugin";
import { cp, rm } from "node:fs/promises";

async function build() {
  await rm("./dist", { recursive: true, force: true });
  await cp("./backend/static", "./dist", { recursive: true });

  await esbuild.build({
    entryPoints: ["./backend/main.ts"],
    bundle: true,
    minify: false,
    minifyWhitespace: false,
    minifyIdentifiers: false,
    minifySyntax: false,
    outfile: "./dist/main.js",
    target: "ES2021",
    keepNames: true,
    plugins: [GasPlugin],
    legalComments: "inline", // コメントを残す
    charset: "utf8", //アスキーコードではなく
  });
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
