# dotfiles

Personal shell configuration, tracked in git so the same setup works on every machine.

Currently manages:

- `.my_aliases` — universal shell aliases for git, node/npm/pnpm/bun, and directory navigation.
- `.my_aliases.machine` — aliases tied to this machine's directory layout (e.g. `goto`). Tracked, but kept separate so the universal file stays clean. Sourced automatically from `.my_aliases`.

## Install on a new machine

```sh
git clone <this-repo> ~/Documents/development/dotfiles
cd ~/Documents/development/dotfiles
./setup.sh
source ~/.zshrc
```

`setup.sh` is idempotent — safe to re-run. It:

1. Symlinks `~/.my_aliases` → `./.my_aliases`.
2. Symlinks `~/.my_aliases.machine` → `./.my_aliases.machine`.
3. Appends `source ~/.my_aliases` to `~/.zshrc` if not already present.

## Adding or editing aliases

Edit `.my_aliases` in the repo directly (the symlink in `$HOME` points here), then:

```sh
reload   # alias for: source ~/.zshrc
```

Commit and push to sync across machines.
