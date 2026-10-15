# Rust Buddy

Rust productivity toolkit for VS Code — manage crates, scaffold files and modules, and more.

Rust Buddy cuts down on the manual boilerplate of managing a Rust project inside VS Code: creating crates, setting up workspaces, adding crates to an existing workspace, and scaffolding module files — all without leaving the editor or hand-writing `Cargo.toml` entries yourself.

## Preview

[![Watch the Rust Buddy preview](https://img.youtube.com/vi/sjuisARFWn8/hqdefault.jpg)](https://www.youtube.com/watch?v=sjuisARFWn8)

## What it does

- Scaffolds new Rust projects and workspaces directly from VS Code, using `cargo new` under the hood
- Adds new crates to an existing Cargo workspace and registers them in the root `Cargo.toml`
- Creates Rust module files and folders in file-style, modern directory-style, or `mod.rs`-style layouts
- Adds the corresponding `mod` declaration when a matching parent Rust source file is available
- Surfaces actions in the Explorer context menu according to detected Cargo workspace and crate locations
- Detects workspace and crate locations automatically; no manual configuration needed

## Features

### Project & workspace creation
- **Create Project** — scaffolds a new standalone Rust crate (binary or library) via `cargo new`
- **Create Workspace** — sets up a new Cargo workspace root (`[workspace]` in `Cargo.toml`, ready for members)
- **Add Crate to Workspace** — creates a new crate inside an existing workspace and registers it as a member

These actions are available from the Command Palette. Explorer context-menu actions target the folder you clicked. The Command Palette also lets you choose a workspace when adding a crate.

### Module scaffolding
- **New file module** — creates a `name.rs` file and adds `mod name;` to the right parent file
- **New directory module** — creates a `name/` folder with the modern (no `mod.rs`) layout
- **New directory module with mod.rs** — creates a `name/mod.rs`-style module (legacy layout)

When Rust Buddy finds the parent Rust source file, it inserts the `mod` declaration alongside existing module declarations. If no matching parent source file is available, it creates the module file or folder without adding a declaration.

### Context-aware Explorer menu
Right-click options adapt to the folder’s detected Cargo location:
- A folder not detected as a crate or workspace root → offers **Create Project** / **Create Workspace** (the folder does not have to be empty)
- A Cargo workspace root → offers **Add Crate to Workspace**
- A folder inside a detected Rust crate → offers the module-creation commands

The extension scans Cargo manifests in the opened workspace and uses them to detect crate and workspace locations. Module-creation actions are available from the Explorer context menu.

## Requirements

- [Rust and Cargo](https://www.rust-lang.org/tools/install) installed and available on your `PATH` for project, workspace, and crate-creation commands
- Visual Studio Code `1.125.0` or later

Rust Buddy checks for Rust and Cargo before running Cargo-related creation commands. Module scaffolding does not require invoking Cargo.

## Usage

1. Open a folder in VS Code that contains (or will contain) Rust code.
2. Open the Command Palette and run **Rust Buddy: Create Project (Standalone Crate)**, **Rust Buddy: Create Workspace**, or **Rust Buddy: Add Crate to Workspace**. These commands prompt you for the needed location and options.
3. To scaffold modules or target a specific folder when creating a project/workspace/crate, right-click the relevant folder in the Explorer and choose a Rust Buddy action.

Rust Buddy runs the appropriate Cargo command and/or makes the related file and manifest edits.

## Development

Requires Node.js 18 or later and npm.

```sh
npm install
npm run compile
npm test
```

`npm run compile` checks types, runs linting, and bundles the extension. `npm test` runs the VS Code extension test suite.

## Known limitations

Known limitations:

- No custom module visibility beyond what's offered in the quick pick (`private`, `pub`, `pub(crate)`, `pub(super)`, `pub(self)`)
- No renaming/deleting of crates or modules through the extension yet — only creation
- Workspace and crate detection is based on scanning `Cargo.toml` files and may take longer in large repositories
- Module declarations are only inserted when a matching parent Rust source file can be found

## Feedback

This extension is under active development. Issues, ideas, and feedback are welcome as it grows beyond this initial feature set.
