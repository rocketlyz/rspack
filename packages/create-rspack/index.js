#!/usr/bin/env node
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const fs = require("fs");
const path = require("path");
const prompts = require("prompts");
const { formatTargetDir } = require("./utils");

yargs(hideBin(process.argv))
	.command("$0", "init rspack project", async argv => {
		const { help } = argv.argv;
		if (help) return;

		const defaultProjectName = "rspack-project";
		let template = "react";
		let targetDir = defaultProjectName;
		const promptProjectDir = async () =>
			await prompts([
				{
					type: "text",
					name: "projectDir",
					initial: defaultProjectName,
					message: "Project folder",
					onState: state => {
						targetDir = formatTargetDir(state.value) || defaultProjectName;
					}
				}
			]);

		await promptProjectDir();
		let root = path.resolve(process.cwd(), targetDir);
		while (fs.existsSync(root)) {
			console.log(
				`${targetDir} is not empty, please choose another project name`
			);
			await promptProjectDir();
			root = path.resolve(process.cwd(), targetDir);
		}

		// choose template
		await prompts([
			{
				type: "select",
				name: "template",
				message: "Project template",
				choices: [
					{ title: "react", value: "react" },
					{ title: "react-ts", value: "react-ts" }
				],
				onState: state => {
					template = state.value;
				}
			}
		]);

		fs.mkdirSync(root, { recursive: true });
		const srcFolder = path.resolve(__dirname, `template-${template}`);
		copyFolder(srcFolder, targetDir);
		const pkgManager = getPkgManager();
		console.log("\nDone. Now run:\n");
		console.log(`cd ${targetDir}\n`);
		console.log(`${pkgManager} install\n`);
		console.log(`${pkgManager} run dev\n`);
	})
	.help()
	.parse();

function copyFolder(src, dst) {
	const renameFiles = {
		_gitignore: ".gitignore"
	};

	fs.mkdirSync(dst, { recursive: true });
	for (const file of fs.readdirSync(src)) {
		const srcFile = path.resolve(src, file);
		const dstFile = renameFiles[file]
			? path.resolve(dst, renameFiles[file])
			: path.resolve(dst, file);
		const stat = fs.statSync(srcFile);
		if (stat.isDirectory()) {
			copyFolder(srcFile, dstFile);
		} else {
			fs.copyFileSync(srcFile, dstFile);
		}
	}
}

function getPkgManager() {
	const ua = process.env.npm_config_user_agent;
	if (!ua) return "npm";
	const [pkgInfo] = ua.split(" ");
	const [name] = pkgInfo.split("/");
	return name || "npm";
}
