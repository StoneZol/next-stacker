const path = require("node:path");
const fs = require("fs-extra");

/** Source root: usually `src`, otherwise project root (no `src`). */
function getPrimarySourceRoot(projectRoot) {
    const src = path.join(projectRoot, "src");
    return fs.existsSync(src) ? src : projectRoot;
}

/** Path to the `4_shared` slice in the target project. */
function getFourSharedRoot(projectRoot) {
    return path.join(
        getPrimarySourceRoot(projectRoot),
        "4_shared",
    );
}

/**
 * Target import prefixes after moving shadcn UI under FSD.
 * We do not edit tsconfig or components.json here — only on-disk file rewrites.
 */
const FSD_ALIAS = {
    components: "@/4_shared/components",
    utils: "@/4_shared/lib/utils",
    ui: "@/4_shared/components/shadcn",
    lib: "@/4_shared/lib",
    hooks: "@/4_shared/hooks",
};

/**
 * Copy a directory tree via readFile/writeFile (more reliable on Windows than copyfile → EPERM).
 * @param {string} srcDir
 * @param {string} destDir
 */
async function copyDirectoryRecursiveReadWrite(
    srcDir,
    destDir,
) {
    await fs.ensureDir(destDir);
    const entries = await fs.readdir(srcDir, {
        withFileTypes: true,
    });
    for (const e of entries) {
        const from = path.join(srcDir, e.name);
        const to = path.join(destDir, e.name);
        if (e.isDirectory()) {
            await copyDirectoryRecursiveReadWrite(from, to);
        } else {
            await fs.ensureDir(path.dirname(to));
            const buf = await fs.readFile(from);
            await fs.writeFile(to, buf);
        }
    }
}

/**
 * Copy `teamplates/ifTwMergeClsxCva` → `<src|root>/4_shared/lib/utils` (overwrite files).
 * @param {{ projectRoot: string }} opts
 */
async function copyTwMergeTemplateIntoFsd({ projectRoot }) {
    const destDir = path.join(
        getFourSharedRoot(projectRoot),
        "lib",
        "utils",
    );
    await fs.ensureDir(destDir);

    const templateDir = path.join(
        __dirname,
        "..",
        "teamplates",
        "ifTwMergeClsxCva",
    );

    await copyDirectoryRecursiveReadWrite(
        templateDir,
        destDir,
    );

    const indexPath = path.join(destDir, "index.ts");
    if (await fs.pathExists(indexPath)) {
        let s = await fs.readFile(indexPath, "utf8");
        s = s.replace(
            /from\s+["']\.\/cn\.ts["']/g,
            'from "./cn"',
        );
        await fs.writeFile(indexPath, s, "utf8");
    }
}

/**
 * Find default shadcn UI dir after init: `components/ui` or `src/components/ui`.
 * @param {string} projectRoot
 * @returns {Promise<string | null>}
 */
async function findDefaultShadcnUiDir(projectRoot) {
    const candidates = [
        path.join(
            getPrimarySourceRoot(projectRoot),
            "components",
            "ui",
        ),
        path.join(projectRoot, "components", "ui"),
    ];
    for (const p of candidates) {
        if (await fs.pathExists(p)) return p;
    }
    return null;
}

/**
 * Rewrite default shadcn import paths to FSD locations under `4_shared`.
 * @param {string} shadcnComponentsDir — e.g. `.../4_shared/components/shadcn`
 */
async function rewriteShadcnImportsToFsd(shadcnComponentsDir) {
    if (!(await fs.pathExists(shadcnComponentsDir))) return;

    const exts = new Set([".ts", ".tsx", ".mts", ".cts"]);
    const uiSlash = `${FSD_ALIAS.ui}/`;
    const hooksSlash = `${FSD_ALIAS.hooks}/`;

    async function walk(d) {
        const entries = await fs.readdir(d, { withFileTypes: true });
        for (const e of entries) {
            const p = path.join(d, e.name);
            if (e.isDirectory()) {
                await walk(p);
            } else if (exts.has(path.extname(e.name))) {
                let s = await fs.readFile(p, "utf8");
                const orig = s;
                s = s.replace(/@\/components\/ui\//g, uiSlash);
                s = s.replace(/@\/lib\/utils/g, FSD_ALIAS.utils);
                s = s.replace(/@\/hooks\//g, hooksSlash);
                if (s !== orig) {
                    await fs.writeFile(p, s, "utf8");
                }
            }
        }
    }

    await walk(shadcnComponentsDir);
}

/**
 * Remove default shadcn `lib` folders (project root and under `src` if present).
 * @param {string} projectRoot
 */
async function removeDefaultShadcnLibFolders(projectRoot) {
    const candidates = [
        path.join(projectRoot, "lib"),
        path.join(getPrimarySourceRoot(projectRoot), "lib"),
    ];
    const seen = new Set();
    for (const p of candidates) {
        const norm = path.resolve(p);
        if (seen.has(norm)) continue;
        seen.add(norm);
        if (await fs.pathExists(p)) {
            await fs.remove(p);
        }
    }
}

/**
 * Move `components/ui` → `4_shared/components/shadcn`, rewrite imports in those files,
 * and merge `components.json` → `aliases` with {@link FSD_ALIAS} so future `shadcn add`
 * emits correct paths. Does not modify tsconfig.
 * @param {{ projectRoot: string }} opts
 */
async function applyShadcnAliasesAndRelocateUi({
    projectRoot,
}) {
    const cfgPath = path.join(
        projectRoot,
        "components.json",
    );
    if (!(await fs.pathExists(cfgPath))) {
        throw new Error(
            `components.json not found: ${cfgPath} (run shadcn init first)`,
        );
    }

    const rawCfg = await fs.readFile(cfgPath, "utf8");
    /** @type {Record<string, unknown>} */
    let cfg = JSON.parse(rawCfg);

    const fourShared = getFourSharedRoot(projectRoot);
    const targetUi = path.join(
        fourShared,
        "components",
        "shadcn",
    );
    await fs.ensureDir(path.join(fourShared, "hooks"));
    await fs.ensureDir(path.join(fourShared, "components"));
    await fs.ensureDir(targetUi);

    const sourceUi =
        await findDefaultShadcnUiDir(projectRoot);
    if (!sourceUi) {
        await removeDefaultShadcnLibFolders(projectRoot);
        return {
            moved: false,
            reason: "components/ui not found — move skipped",
        };
    }

    const resolvedSource = path.resolve(sourceUi);
    const resolvedTarget = path.resolve(targetUi);
    if (resolvedSource === resolvedTarget) {
        cfg.aliases = {
            ...(typeof cfg.aliases === "object" &&
            cfg.aliases !== null &&
            !Array.isArray(cfg.aliases)
                ? cfg.aliases
                : {}),
            ...FSD_ALIAS,
        };
        await fs.writeFile(
            cfgPath,
            `${JSON.stringify(cfg, null, 2)}\n`,
            "utf8",
        );
        await removeDefaultShadcnLibFolders(projectRoot);
        return {
            moved: false,
            reason: "ui already at target location",
        };
    }

    if (await fs.pathExists(resolvedTarget)) {
        await fs.remove(resolvedTarget);
    }
    await fs.ensureDir(resolvedTarget);
    await copyDirectoryRecursiveReadWrite(
        resolvedSource,
        resolvedTarget,
    );

    const legacyComponentsDir = path.dirname(resolvedSource);
    await fs.remove(resolvedSource);
    if (await fs.pathExists(legacyComponentsDir)) {
        await fs.remove(legacyComponentsDir);
    }

    await rewriteShadcnImportsToFsd(resolvedTarget);

    cfg.aliases = {
        ...(typeof cfg.aliases === "object" &&
        cfg.aliases !== null &&
        !Array.isArray(cfg.aliases)
            ? cfg.aliases
            : {}),
        ...FSD_ALIAS,
    };
    await fs.writeFile(
        cfgPath,
        `${JSON.stringify(cfg, null, 2)}\n`,
        "utf8",
    );

    await removeDefaultShadcnLibFolders(projectRoot);

    return {
        moved: true,
        from: sourceUi,
        to: targetUi,
        legacyComponentsDirRemoved: legacyComponentsDir,
    };
}

/**
 * After shadcn: if FSD — copy tw-merge template; if FSD + shadcn init — relocate ui + rewrite imports.
 *
 * @param {{
 *   projectRoot: string;
 *   fsdEnabled: boolean;
 *   fsdTemplateApplied: boolean;
 *   shadcnInitDone: boolean;
 * }} opts
 */
async function runFsdPostIntegrate(opts) {
    const {
        projectRoot,
        fsdEnabled,
        fsdTemplateApplied,
        shadcnInitDone,
    } = opts;

    if (!fsdEnabled || !fsdTemplateApplied) {
        return {
            twMergeCopied: false,
            shadcnAdjusted: false,
            skipped: true,
        };
    }

    await copyTwMergeTemplateIntoFsd({ projectRoot });
    const result = {
        twMergeCopied: true,
        shadcnAdjusted: false,
        relocate: null,
    };

    if (shadcnInitDone) {
        result.relocate =
            await applyShadcnAliasesAndRelocateUi({
                projectRoot,
            });
        result.shadcnAdjusted = true;
    }

    return result;
}

module.exports = {
    runFsdPostIntegrate,
    copyTwMergeTemplateIntoFsd,
    applyShadcnAliasesAndRelocateUi,
    rewriteShadcnImportsToFsd,
    getFourSharedRoot,
    getPrimarySourceRoot,
    copyDirectoryRecursiveReadWrite,
    removeDefaultShadcnLibFolders,
    FSD_ALIAS,
};
