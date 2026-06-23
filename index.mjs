#!/usr/bin/env node
import path from "node:path";
import {
    cancel,
    confirm,
    intro,
    isCancel,
    outro,
    text,
} from "@clack/prompts";
import { multiselectWithFocusHint } from "./lib/multiselectWithFocusHint.mjs";
import {
    getStackerState,
    patchStackerState,
    resetStackerState,
} from "./lib/stackerState.mjs";

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
    createNextApp,
} = require("./pipes/createNextApp.js");
const { addLibs } = require("./pipes/addLibs.js");
const { applyFsdLayout } = require("./pipes/useFSDvers.js");
const { runShadcnInit } = require("./pipes/addShadcn.js");
const {
    runFsdPostIntegrate,
} = require("./pipes/fsdPostIntegrate.js");
const {
    applyVscodeComponentsTeamplate,
} = require("./pipes/addVScodeComponentsTeamplate.js");
const { packs } = require("./packs.js");

function canceled() {
    cancel("Canceled.");
    process.exit(0);
}

async function main() {
    resetStackerState();
    intro("next-stacker");

    const projectName = await text({
        message:
            "Project folder name (npx create-next-app@latest)",
        placeholder: "my-app",
        validate: (value) => {
            const v = String(value ?? "").trim();
            if (!v) return "Specify a name";
            if (/[/\\]/.test(v))
                return "Only the folder name, without a path";
            return undefined;
        },
    });

    if (isCancel(projectName)) {
        canceled();
    }

    const name = String(projectName).trim();
    const root = process.cwd();
    const projectRoot = path.join(root, name);

    patchStackerState({
        projectName: name,
        projectRoot,
    });

    await createNextApp({ projectName: name });

    const selectedIds = await multiselectWithFocusHint({
        message:
            "Additional libraries (one npm install for prod / dev)",
        options: packs.map((p) => ({
            value: p.id,
            label: p.title,
        })),
        required: false,
    });

    if (isCancel(selectedIds)) {
        canceled();
    }

    const ids = Array.isArray(selectedIds)
        ? selectedIds
        : [];
    patchStackerState({ selectedPackIds: ids });

    if (ids.length > 0) {
        await addLibs({ cwd: projectRoot, packIds: ids });
    }

    const useFsd = await confirm({
        message: "Create FSD folder structure?",
        initialValue: false,
    });

    if (isCancel(useFsd)) {
        canceled();
    }

    patchStackerState({
        fsdEnabled: useFsd,
        fsdTemplateApplied: false,
    });

    if (useFsd) {
        await applyFsdLayout({ projectRoot });
        patchStackerState({ fsdTemplateApplied: true });
    }

    const useVscodeTemplate = await confirm({
        message:
            "Use VSCode folder-templates (FSD) in this project?",
        initialValue: false,
    });
    if (isCancel(useVscodeTemplate)) {
        canceled();
    }
    patchStackerState({
        vscodeComponentsTeamplateApplied: useVscodeTemplate,
    });
    if (useVscodeTemplate) {
        await applyVscodeComponentsTeamplate({
            projectRoot,
        });
    }

    const useShadcn = await confirm({
        message: "Use shadcn/ui (npx shadcn@latest init) ?",
        initialValue: true,
    });

    if (isCancel(useShadcn)) {
        canceled();
    }

    patchStackerState({
        shadcnOfferAccepted: useShadcn,
        shadcnInitDone: false,
    });

    if (useShadcn) {
        await runShadcnInit({ cwd: projectRoot });
        patchStackerState({ shadcnInitDone: true });
    }

    const snap = getStackerState();
    if (snap.fsdEnabled && snap.fsdTemplateApplied) {
        await runFsdPostIntegrate({
            projectRoot,
            fsdEnabled: snap.fsdEnabled,
            fsdTemplateApplied: snap.fsdTemplateApplied,
            shadcnInitDone: snap.shadcnInitDone,
        });
        patchStackerState({
            shadcnPostFsdAdjustDone: true,
        });
    }

    outro("Done.");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
