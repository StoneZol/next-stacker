/**
 * Wrapper around MultiSelectPrompt (@clack/core), forked from @clack/prompts multiselect.
 * Adds a visible cyan focus marker for active-selected rows so the cursor line stays obvious
 * when the checkbox is already filled green.
 */
import { styleText } from "node:util";
import {
    MultiSelectPrompt,
    settings,
    wrapTextWithPrefix,
} from "@clack/core";
import { limitOptions } from "@clack/prompts";
import {
    S_BAR,
    S_BAR_END,
    S_CHECKBOX_ACTIVE,
    S_CHECKBOX_INACTIVE,
    S_CHECKBOX_SELECTED,
    symbol,
    symbolBar,
} from "@clack/prompts";

const FOCUS_SUFFIX = () => ` ${styleText("cyan", "<")}`;

const computeLabel = (label, format) =>
    label
        .split("\n")
        .map((line) => format(line))
        .join("\n");

/**
 * @param {import('@clack/prompts').MultiSelectOptions<Value>} opts
 * @template Value
 */
export function multiselectWithFocusHint(opts) {
    const opt = (option, state) => {
        const label = option.label ?? String(option.value);
        if (state === "disabled") {
            return `${styleText("gray", S_CHECKBOX_INACTIVE)} ${computeLabel(
                label,
                (str) =>
                    styleText(
                        ["strikethrough", "gray"],
                        str,
                    ),
            )}${
                option.hint
                    ? ` ${styleText("dim", `(${option.hint ?? "disabled"})`)}`
                    : ""
            }`;
        }
        if (state === "active") {
            return `${styleText("cyan", S_CHECKBOX_ACTIVE)} ${label}${
                option.hint
                    ? ` ${styleText("dim", `(${option.hint})`)}`
                    : ""
            }`;
        }
        if (state === "selected") {
            return `${styleText("green", S_CHECKBOX_SELECTED)} ${computeLabel(
                label,
                (text) => styleText("dim", text),
            )}`;
        }
        if (state === "cancelled") {
            return computeLabel(label, (text) =>
                styleText(["strikethrough", "dim"], text),
            );
        }
        if (state === "active-selected") {
            return `${styleText("green", S_CHECKBOX_SELECTED)} ${label}${FOCUS_SUFFIX()}`;
        }
        if (state === "submitted") {
            return computeLabel(label, (text) =>
                styleText("dim", text),
            );
        }
        return `${styleText("dim", S_CHECKBOX_INACTIVE)} ${computeLabel(
            label,
            (text) => styleText("dim", text),
        )}`;
    };

    const required = opts.required ?? true;

    return new MultiSelectPrompt({
        options: opts.options,
        signal: opts.signal,
        input: opts.input,
        output: opts.output,
        initialValues: opts.initialValues,
        required,
        cursorAt: opts.cursorAt,
        validate(selected) {
            if (
                required &&
                (selected === undefined ||
                    selected.length === 0)
            ) {
                return `Please select at least one option.\n${styleText(
                    "reset",
                    styleText(
                        "dim",
                        `Press ${styleText(["gray", "bgWhite", "inverse"], " space ")} to select, ${styleText(
                            "gray",
                            styleText(
                                "bgWhite",
                                styleText(
                                    "inverse",
                                    " enter ",
                                ),
                            ),
                        )} to submit`,
                    ),
                )}`;
            }
        },
        render() {
            const hasGuide =
                opts.withGuide ?? settings.withGuide;
            const wrappedMessage = wrapTextWithPrefix(
                opts.output,
                opts.message,
                hasGuide ? `${symbolBar(this.state)} ` : "",
                `${symbol(this.state)} `,
            );
            const title = `${hasGuide ? `${styleText("gray", S_BAR)}\n` : ""}${wrappedMessage}\n`;
            const value = this.value ?? [];

            const styleOption = (option, active) => {
                if (option.disabled) {
                    return opt(option, "disabled");
                }
                const selected = value.includes(
                    option.value,
                );
                if (active && selected) {
                    return opt(option, "active-selected");
                }
                if (selected) {
                    return opt(option, "selected");
                }
                return opt(
                    option,
                    active ? "active" : "inactive",
                );
            };

            switch (this.state) {
                case "submit": {
                    const submitText =
                        this.options
                            .filter(
                                ({ value: optionValue }) =>
                                    value.includes(
                                        optionValue,
                                    ),
                            )
                            .map((option) =>
                                opt(option, "submitted"),
                            )
                            .join(styleText("dim", ", ")) ||
                        styleText("dim", "none");
                    const wrappedSubmitText =
                        wrapTextWithPrefix(
                            opts.output,
                            submitText,
                            hasGuide
                                ? `${styleText("gray", S_BAR)} `
                                : "",
                        );
                    return `${title}${wrappedSubmitText}`;
                }
                case "cancel": {
                    const label = this.options
                        .filter(({ value: optionValue }) =>
                            value.includes(optionValue),
                        )
                        .map((option) =>
                            opt(option, "cancelled"),
                        )
                        .join(styleText("dim", ", "));
                    if (label.trim() === "") {
                        return `${title}${styleText("gray", S_BAR)}`;
                    }
                    const wrappedLabel = wrapTextWithPrefix(
                        opts.output,
                        label,
                        hasGuide
                            ? `${styleText("gray", S_BAR)} `
                            : "",
                    );
                    return `${title}${wrappedLabel}${hasGuide ? `\n${styleText("gray", S_BAR)}` : ""}`;
                }
                case "error": {
                    const prefix = hasGuide
                        ? `${styleText("yellow", S_BAR)} `
                        : "";
                    const footer = this.error
                        .split("\n")
                        .map((ln, i) =>
                            i === 0
                                ? `${hasGuide ? `${styleText("yellow", S_BAR_END)} ` : ""}${styleText("yellow", ln)}`
                                : ` ${ln}`,
                        )
                        .join("\n");
                    const titleLineCount =
                        title.split("\n").length;
                    const footerLineCount =
                        footer.split("\n").length + 1;
                    return `${title}${prefix}${limitOptions(
                        {
                            output: opts.output,
                            options: this.options,
                            cursor: this.cursor,
                            maxItems: opts.maxItems,
                            columnPadding: prefix.length,
                            rowPadding:
                                titleLineCount +
                                footerLineCount,
                            style: styleOption,
                        },
                    ).join(`\n${prefix}`)}\n${footer}\n`;
                }
                default: {
                    const prefix = hasGuide
                        ? `${styleText("cyan", S_BAR)} `
                        : "";
                    const titleLineCount =
                        title.split("\n").length;
                    const footerLineCount = hasGuide
                        ? 2
                        : 1;
                    return `${title}${prefix}${limitOptions(
                        {
                            output: opts.output,
                            options: this.options,
                            cursor: this.cursor,
                            maxItems: opts.maxItems,
                            columnPadding: prefix.length,
                            rowPadding:
                                titleLineCount +
                                footerLineCount,
                            style: styleOption,
                        },
                    ).join(
                        `\n${prefix}`,
                    )}\n${hasGuide ? styleText("cyan", S_BAR_END) : ""}\n`;
                }
            }
        },
    }).prompt();
}
