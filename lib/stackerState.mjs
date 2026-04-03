/**
 * Single source of truth for next-stacker session choices and flags.
 * Extend {@link StackerState} and {@link createInitialStackerState} when adding fields;
 * updates go through {@link patchStackerState} only.
 */

/**
 * @typedef {Object} StackerState
 * @property {string | null} projectName — folder name passed to create-next-app
 * @property {string | null} projectRoot — absolute path to the new project root
 * @property {string[]} selectedPackIds — selected ids from `packs.js`
 * @property {boolean} fsdEnabled — user opted into the FSD template
 * @property {boolean} fsdTemplateApplied — FSD template was copied into `projectRoot`
 * @property {boolean} vscodeComponentsTeamplateApplied — VS Code folder-templates template was applied
 *
 * Reserved for shadcn / post-FSD steps:
 * @property {boolean | null} [shadcnOfferAccepted] — null until the prompt; then user choice
 * @property {boolean} [shadcnInitDone] — `shadcn init` (or equivalent) finished
 * @property {boolean} [shadcnPostFsdAdjustDone] — post-init FSD moves / rewrites completed
 */

/** @returns {StackerState} */
function createInitialStackerState() {
    return {
        projectName: null,
        projectRoot: null,
        selectedPackIds: [],
        fsdEnabled: false,
        fsdTemplateApplied: false,
        vscodeComponentsTeamplateApplied: false,
        shadcnOfferAccepted: null,
        shadcnInitDone: false,
        shadcnPostFsdAdjustDone: false,
    };
}

/** @type {StackerState} */
let current = createInitialStackerState();

/** Reset before a new CLI run (e.g. if `main` is invoked more than once). */
export function resetStackerState() {
    current = createInitialStackerState();
}

/**
 * Immutable snapshot (shallow copy), safe for pipes to read.
 * @returns {Readonly<StackerState>}
 */
export function getStackerState() {
    return Object.freeze({
        ...current,
        selectedPackIds: [...current.selectedPackIds],
    });
}

/**
 * Partial state update.
 * @param {Partial<StackerState>} patch
 */
export function patchStackerState(patch) {
    current = {
        ...current,
        ...patch,
        selectedPackIds:
            patch.selectedPackIds !== undefined
                ? [...patch.selectedPackIds]
                : [...current.selectedPackIds],
    };
}

/**
 * Full replace (tests / future snapshot restore).
 * @param {StackerState} next
 */
export function replaceStackerState(next) {
    current = {
        ...createInitialStackerState(),
        ...next,
        selectedPackIds: [...(next.selectedPackIds ?? [])],
    };
}

export { createInitialStackerState };
