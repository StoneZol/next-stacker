/**
 * Runs official `create-next-app@latest` in `cwd` with folder name `projectName`
 * (same as the Next CLI).
 *
 * @param {{
 *   projectName: string;
 *   cwd?: string;
 *   extraArgs?: string[];
 * }} opts extraArgs — extra CLI args after the project name (e.g. non-interactive flags)
 */
async function createNextApp(opts) {
    const { execa } = await import("execa");

    const projectName = String(
        opts.projectName ?? "",
    ).trim();
    if (!projectName) {
        throw new Error(
            "createNextApp: projectName is required",
        );
    }
    if (/[/\\]/.test(projectName)) {
        throw new Error(
            "createNextApp: projectName must be a single folder name (no path separators)",
        );
    }

    const cwd = opts.cwd ?? process.cwd();
    const extra = Array.isArray(opts.extraArgs)
        ? opts.extraArgs
        : [];

    await execa(
        "npx",
        ["create-next-app@latest", projectName, ...extra],
        {
            cwd,
            stdio: "inherit",
        },
    );
}

module.exports = { createNextApp };
