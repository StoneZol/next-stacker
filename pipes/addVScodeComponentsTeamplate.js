const path = require("node:path");
const fs = require("fs-extra");
const VSCODE_COMPONENTS_TEMPLATE_DIR = path.join(
    __dirname,
    "..",
    "teamplates",
    "vscodeComponentsTeampalate",
);

/**
 * Copies the VS Code folder-templates snippet into the Next.js project root.
 *
 * @param {{ projectRoot: string }} opts
 */

async function applyVscodeComponentsTeamplate(opts) {
    const projectRoot = String(
        opts.projectRoot ?? "",
    ).trim();
    if (!projectRoot) {
        throw new Error(
            "applyVscodeComponentsTeamplate: projectRoot is required",
        );
    }

    const exists = await fs.pathExists(VSCODE_COMPONENTS_TEMPLATE_DIR);
    if (!exists) {
        throw new Error(
            `VSCode template not found: ${VSCODE_COMPONENTS_TEMPLATE_DIR}`,
        );
    }

    await fs.copy(VSCODE_COMPONENTS_TEMPLATE_DIR, projectRoot, {
        overwrite: true,
    });
}
module.exports = {
    applyVscodeComponentsTeamplate,
    VSCODE_COMPONENTS_TEMPLATE_DIR,
};
