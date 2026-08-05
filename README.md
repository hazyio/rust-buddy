# Rust Buddy

Rust productivity toolkit for VS Code — manage crates, scaffold files and modules, and more.

Rust Buddy cuts down on the manual boilerplate of managing a Rust project inside VS Code: creating crates, setting up workspaces, adding crates to an existing workspace, and scaffolding module files — all without leaving the editor or hand-writing `Cargo.toml` entries yourself.

## What it does

- Scaffolds new Rust projects and workspaces directly from VS Code, using `cargo new` under the hood
- Adds new crates to an existing Cargo workspace and keeps the root `Cargo.toml`'s `members` list correct
- Creates Rust module files (file-style, directory-style, and `mod.rs`-style) and automatically inserts the corresponding `mod` declaration in the right place
- Surfaces relevant actions via right-click in the Explorer, based on what kind of folder you clicked (empty folder, workspace root, or crate root) — so you only see options that make sense for that folder
- Detects your workspace/crate layout automatically; no manual configuration needed

## Features

### Project & workspace creation
- **Create Project** — scaffolds a new standalone Rust crate (binary or library) via `cargo new`
- **Create Workspace** — sets up a new Cargo workspace root (`[workspace]` in `Cargo.toml`, ready for members)
- **Add Crate to Workspace** — creates a new crate inside an existing workspace and registers it as a member

Each of these is available both from the Command Palette and from the Explorer right-click menu — the context-menu versions target the folder you clicked rather than asking you to pick one.

### Module scaffolding
- **New file module** — creates a `name.rs` file and adds `mod name;` to the right parent file
- **New directory module** — creates a `name/` folder with the modern (no `mod.rs`) layout
- **New directory module with mod.rs** — creates a `name/mod.rs`-style module (legacy layout)

In all three cases, Rust Buddy finds the correct place to insert the `mod` declaration — right after any existing `mod` lines, so your declarations stay grouped at the top of the file and any code below is left untouched.

### Context-aware Explorer menu
Right-click options adapt to what you clicked:
- An empty folder (not yet part of a crate or workspace) → offers **Create Project** / **Create Workspace**
- A Cargo workspace root → offers **Add Crate to Workspace**
- Inside a Rust crate (root or any subfolder) → offers the module-creation commands

This is driven by background detection of your Cargo workspaces and crates, so the menu only shows actions that are actually valid for that location.

## Requirements

- [Rust and Cargo](https://www.rust-lang.org/tools/install) installed and available on your `PATH`
- Rust Buddy checks for both before running any command and will let you know if either is missing

## Usage

1. Open a folder in VS Code that contains (or will contain) Rust code
2. Right-click a folder in the Explorer, or open the Command Palette and search for **"Rust Buddy"**
3. Pick the action you need — Rust Buddy handles the `cargo` command and any file/manifest edits for you

## Known limitations (early version)

This is an early build — functionality is intentionally minimal right now so it can be tried out on a real project before more features are added. Known rough edges:

- No custom module visibility beyond what's offered in the quick pick (`private`, `pub`, `pub(crate)`, `pub(super)`, `pub(self)`)
- No renaming/deleting of crates or modules through the extension yet — only creation
- Large repositories with many `Cargo.toml` files may take a moment to fully index on first load

## Feedback

This extension is under active development. Issues, ideas, and feedback are welcome as it grows beyond this initial feature set.
