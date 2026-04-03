const reactHookFormZodResolvers = {
    id: "react-hook-form-zod-resolvers",
    title: "React Hook Form + Zod + resolvers",
    install: "react-hook-form zod @hookform/resolvers",
    isDev: false,
};

const zustand = {
    id: "zustand",
    title: "Zustand",
    install: "zustand",
    isDev: false,
};

const tanstackQuery = {
    id: "tanstack-query",
    title: "TanStack Query",
    install: "@tanstack/react-query",
    isDev: false,
};

const dayjs = {
    id: "dayjs",
    title: "Day.js",
    install: "dayjs",
    isDev: false,
};

const nextThemes = {
    id: "next-themes",
    title: "next-themes",
    install: "next-themes",
    isDev: false,
};

const twMergeClsx = {
    id: "twMergeClsxCva",
    title: "tailwind merge + clsx + class-variance-authority",
    install: "clsx tailwind-merge class-variance-authority",
    isDev: false,
};

// const vitestPlaywright = {
//     id: "vitest-playwright",
//     title: "Vitest + Playwright",
//     install: "vitest playwright",
//     isDev: true,
// };

// const oxlintOxfmt = {
//     id: "oxlint-oxfmt",
//     title: "oxlint + oxfmt",
//     install: "oxlint oxfmt",
//     isDev: true,
// };

const packs = [
    nextThemes,
    twMergeClsx,
    reactHookFormZodResolvers,
    zustand,
    tanstackQuery,
    dayjs,
];

module.exports = { packs };
