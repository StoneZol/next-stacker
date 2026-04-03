/**
 * Runs official shadcn/ui CLI in the Next.js project root.
 * @see https://ui.shadcn.com/docs/cli
 *
 * @param {{
 *   cwd: string;
 *   extraArgs?: string[];
 * }} opts
 */
async function runShadcnInit(opts) {
    const { execa } = await import("execa");

    const cwd = String(opts.cwd ?? "").trim();
    if (!cwd) {
        throw new Error("runShadcnInit: cwd is required");
    }

    const extra = Array.isArray(opts.extraArgs) ? opts.extraArgs : [];

    await execa("npx", ["shadcn@latest", "init", ...extra], {
        cwd,
        stdio: "inherit",
    });
}

module.exports = { runShadcnInit };
