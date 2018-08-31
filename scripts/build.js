const { router } = require("cmdrouter");
const browserify = require("browserify");
const fs = require("fs-extra-plus");
const exorcist = require("exorcist");
const chokidar = require("chokidar");
const Terser = require("terser");

const srcFile = "./src/index.js";
const distBase = "./dist/mvdom", distJs = distBase + ".js", distMin = distBase + ".min.js";

// we route the command to the appropriate function
router({ _default, compile, watch }).route();

// --------- Command Functions --------- //
async function _default() {
	await compile();
}

async function compile(mode) {
	await fs.mkdirs("./dist/");

	await fs.saferRemove([distJs]);

	await browserifyFiles(srcFile, distJs);
	const distStat = await fs.stat(distJs);
	console.log(`Browserified ${distJs} - ${distStat.size / 1000}kb`);

	var content = await fs.readFile(distJs, "utf8");
	const minContent = Terser.minify(content);
	await fs.writeFile(distMin, minContent.code, "utf8");
	const minStat = await fs.stat(distMin);
	console.log(`Minified ${distMin} - ${minStat.size / 1000}kb`);

}

async function watch() {
	// first we build all
	await _default();
	const srcDir = `src/**/*.js`;

	const watcher = chokidar.watch(srcDir, { depth: 99, ignoreInitial: true, persistent: true });
	watcher.on('change', async function (filePath) {
		compile();
	});
}
// --------- /Command Functions --------- //


// --------- Utils --------- //
async function browserifyFiles(entries, distFile) {

	var mapFile = distFile + ".map";

	await fs.saferRemove([distFile, mapFile]);

	var b = browserify({
		entries,
		entry: true,
		debug: true
	});


	// wrap the async browserify bundle into a promise to make it "async" friendlier
	return new Promise(function (resolve, reject) {

		var writableFs = fs.createWriteStream(distFile);
		// resolve promise when file is written
		writableFs.on("finish", () => resolve());
		// reject if we have a write error
		writableFs.on("error", (ex) => reject(ex));

		b.bundle()
			// reject if we have a bundle error
			.on("error", function (err) { reject(err); })
			// or continue the flow
			.pipe(exorcist(mapFile))
			.pipe(writableFs);

	});
}
// --------- /Utils --------- //
