import fs from "fs-extra";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { packs } = require("../packs.js");

/**
 * Whether `packageName` exists as a key in root `package.json` `dependencies` or `devDependencies`.
 * Must match the key in JSON (e.g. `@tanstack/react-query`, `zod`).
 *
 * @param {string} projectRoot — absolute path to project root (where `package.json` lives)
 * @param {string} packageName
 * @returns {Promise<boolean>}
 */
export async function hasInstalledPackage(projectRoot, packageName) {
    const key = String(packageName ?? "").trim();
    if (!key) return false;

    const pkgPath = path.join(projectRoot, "package.json");
    if (!(await fs.pathExists(pkgPath))) return false;

    let pkg;
    try {
        pkg = await fs.readJson(pkgPath);
    } catch {
        return false;
    }

    const deps = pkg.dependencies && typeof pkg.dependencies === "object"
        ? pkg.dependencies
        : {};
    const devDeps = pkg.devDependencies &&
            typeof pkg.devDependencies === "object"
        ? pkg.devDependencies
        : {};

    return (
        Object.prototype.hasOwnProperty.call(deps, key) ||
        Object.prototype.hasOwnProperty.call(devDeps, key)
    );
}

/**
 * True when every npm package listed in the pack `install` field exists in the project.
 *
 * @param {string} projectRoot
 * @param {string} packId — id from `packs.js`
 * @returns {Promise<boolean>}
 */
export async function hasPackInstalled(projectRoot, packId) {
    const id = String(packId ?? "").trim();
    if (!id) return false;

    const pack = packs.find((p) => p.id === id);
    if (!pack) return false;

    const names = String(pack.install ?? "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (names.length === 0) return false;

    for (const name of names) {
        if (!(await hasInstalledPackage(projectRoot, name))) {
            return false;
        }
    }
    return true;
}
