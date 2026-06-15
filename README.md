# next-stacker

Interactive CLI that scaffolds a **Next.js** project and layers your tooling on top: **extra npm packages**, optional **Feature-Sliced Design (FSD)** layout, **VS Code** folder-templates, **shadcn/ui**, and post-setup steps (tw-merge helpers, moving shadcn UI into `4_shared`, import rewrites).

## Run with `npx`

You can run it without cloning:

```bas
npx next-stacker
```

(Exact `npx` syntax for Git may vary by npm version; cloning and `npm install && npm start` is always reliable.)

**Local development** (this repo):

```bash
npm install
npm start
# or, after npm link / global install:
next-stacker
```

The CLI entry is declared in **`package.json` → `bin`** and points to **`index.mjs`** (with a Node shebang). Run the command from the directory where the new project folder should be created (the CLI creates `<folder-name>/` under the current working directory).

## What it does

1. Runs the official **`create-next-app@latest`** (always current upstream behavior).
2. Lets you pick **optional libraries** from a curated list (`packs.js`) and runs **`npm install`** in batches (prod vs dev).
3. Optionally copies an **FSD template** from `teamplates/fsd` into the new project root.
4. Optionally create in **VS Code** workspace settings from `teamplates/vscodeComponentsTeampalate` into the new project (merges with `overwrite: true`).
That file configures the **[Fast Folder Structure](https://marketplace.visualstudio.com/items?itemName=Huuums.vscode-fast-folder-structure)** extension (`folderTemplates.*`). In VS Code, the **“Component Template”** preset creates a folder with this layout (`<FTName>` = name you enter, e.g. `Button`):

   ```text
   <FTName>/
   ├── index.ts
   ├── <FTName>.tsx
   ├── <FTName>.hooks.ts
   └── <FTName>.types.ts
   ```

   Example for `Button`:

   ```text
   Button/
   ├── index.ts
   ├── Button.tsx
   ├── Button.hooks.ts
   └── Button.types.ts
   ```

   Templates for each file live in `settings.json` under `folderTemplates.fileTemplates`; edit them there or add more `folderTemplates.structures` entries if you need other scaffolds.
5. Optionally runs **`npx shadcn@latest init`** in the project.
6. If FSD was applied and shadcn ran, runs **post-integration**: copies `teamplates/ifTwMergeClsxCva` into `4_shared/lib/utils`, relocates `components/ui` → `4_shared/components/shadcn`, rewrites default shadcn import paths, removes legacy `components/` and default `lib/` folders.

Session choices are tracked in **`lib/stackerState.mjs`** for extension and debugging.

## Library presets (`packs.js`)

Optional packs you can toggle in the CLI (each runs as one `npm install` batch; dev vs prod follows `isDev`):

| Title | Pack id | Packages installed |
|--------|---------|-------------------|
| next-themes | `next-themes` | `next-themes` |
| next-intl | `next-intl` | `next-intl` |
| React Hook Form + Zod + resolvers | `react-hook-form-zod-resolvers` | `react-hook-form`, `zod`, `@hookform/resolvers` |
| Zustand | `zustand` | `zustand` |
| TanStack Query | `tanstack-query` | `@tanstack/react-query` |
| Day.js | `dayjs` | `dayjs` |
| tailwind-merge + clsx + CVA | `twMergeClsxCva` | `clsx`, `tailwind-merge`, `class-variance-authority` |
| schema-dts | `schema-dts` | `schema-dts` |

All current packs are **production** dependencies (`isDev: false`). Edit `packs.js` to add or change presets.

## Source repository

- **GitHub:** [github.com/StoneZol/next-stacker](https://github.com/StoneZol/next-stacker)  
  Update `repository` / `homepage` in `package.json` if your fork lives elsewhere.

## Stack

- **[@clack/prompts](https://github.com/bombshell-dev/clack)** — terminal UI
- **[execa](https://github.com/sindresorhus/execa)** — running `npx` / `npm`
- **[fs-extra](https://github.com/jprichardson/node-fs-extra)** — filesystem copy/remove

## Project layout

| Path | Role |
|------|------|
| `index.mjs` | CLI entry |
| `packs.js` | Library “packs” (id, title, install line, dev flag) |
| `pipes/` | Steps: `createNextApp`, `addLibs`, `useFSDvers`, `addShadcn`, `fsdPostIntegrate`, VS Code template |
| `lib/` | `stackerState.mjs`, `projectDependencies.mjs`, multiselect helper |
| `teamplates/` | FSD, tw-merge, VS Code snippets, etc. |

## Requirements

- **Node.js** with ESM support (`index.mjs` uses `import`).
- **npm** / **npx** available on `PATH`.

## License

MIT
