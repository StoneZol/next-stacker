const path = require("node:path");
const fs = require("fs-extra");

/** `teamplates/fsd` relative to the next-stacker package root */
const FSD_TEMPLATE_DIR = path.join(__dirname, "..", "teamplates", "fsd");

/**
 * Copies the FSD template tree into the root of the Next.js project.
 *
 * @param {{ projectRoot: string }} opts
 */
async function applyFsdLayout(opts) {
    const projectRoot = String(opts.projectRoot ?? "").trim();
    if (!projectRoot) {
        throw new Error("applyFsdLayout: projectRoot is required");
    }

    const exists = await fs.pathExists(FSD_TEMPLATE_DIR);
    if (!exists) {
        throw new Error(`FSD template not found: ${FSD_TEMPLATE_DIR}`);
    }

    await fs.copy(FSD_TEMPLATE_DIR, projectRoot, {
        overwrite: true,
    });
}

module.exports = { applyFsdLayout, FSD_TEMPLATE_DIR };
