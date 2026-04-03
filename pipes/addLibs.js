const { packs: defaultPacks } = require("../packs.js");

/**
 * Split `install` string into package names (whitespace-separated).
 * @param {{ install: string }} pack
 * @returns {string[]}
 */
function installTokens(pack) {
    return String(pack.install ?? "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
}

/**
 * One `npm install` for prod deps and, if needed, one `npm install -D` for dev deps.
 *
 * @param {{
 *   cwd: string;
 *   packIds: string[];
 *   packs?: typeof defaultPacks;
 * }} opts
 */
async function addLibs(opts) {
    const { execa } = await import("execa");

    const cwd = String(opts.cwd ?? "").trim();
    if (!cwd) {
        throw new Error("addLibs: cwd is required");
    }

    const catalog = opts.packs ?? defaultPacks;
    const ids = Array.isArray(opts.packIds)
        ? opts.packIds
        : [];
    const selected = catalog.filter((p) =>
        ids.includes(p.id),
    );

    const prod = [];
    const dev = [];
    for (const pack of selected) {
        const tokens = installTokens(pack);
        if (pack.isDev) dev.push(...tokens);
        else prod.push(...tokens);
    }

    const uniq = (arr) => [...new Set(arr)];
    const prodPkgs = uniq(prod);
    const devPkgs = uniq(dev);

    if (prodPkgs.length === 0 && devPkgs.length === 0) {
        return { installed: [], skipped: true };
    }

    if (prodPkgs.length > 0) {
        await execa("npm", ["install", ...prodPkgs], {
            cwd,
            stdio: "inherit",
        });
    }
    if (devPkgs.length > 0) {
        await execa("npm", ["install", "-D", ...devPkgs], {
            cwd,
            stdio: "inherit",
        });
    }

    return {
        installed: [
            ...prodPkgs,
            ...devPkgs.map((p) => `${p} (dev)`),
        ],
        skipped: false,
    };
}

module.exports = { addLibs, installTokens };
