#!/usr/bin/env bash
set -euo pipefail

DOTFILES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_LINE='[ -f "$HOME/.my_aliases" ] && source "$HOME/.my_aliases"'

link_file() {
  local src="$1" dest="$2"
  if [ -L "$dest" ] && [ "$(readlink "$dest")" = "$src" ]; then
    echo "Symlink already in place: $dest"
    return
  fi
  # Never clobber a real file that isn't already one of our symlinks.
  if [ -e "$dest" ] && [ ! -L "$dest" ]; then
    mv "$dest" "$dest.bak"
    echo "Backed up existing $dest -> $dest.bak"
  fi
  ln -sfn "$src" "$dest"
  echo "Linked $dest -> $src"
}

link_file "$DOTFILES_DIR/.my_aliases"         "$HOME/.my_aliases"
link_file "$DOTFILES_DIR/.my_aliases.machine" "$HOME/.my_aliases.machine"
link_file "$DOTFILES_DIR/ai"                   "$HOME/.ai"

# Claude Code user-level memory (~/.claude/CLAUDE.md). Per-project personal
# instructions live in ai/projects/ and are reached through the ~/.ai symlink.
mkdir -p "$HOME/.claude"
link_file "$DOTFILES_DIR/ai/claude-global.md" "$HOME/.claude/CLAUDE.md"

if ! grep -Fq "$SOURCE_LINE" "$HOME/.zshrc" 2>/dev/null; then
  {
    echo ""
    echo "# Custom aliases"
    echo "$SOURCE_LINE"
  } >> "$HOME/.zshrc"
  echo "Added source line to ~/.zshrc"
else
  echo "Source line already in ~/.zshrc"
fi

echo "Done. Run: source ~/.zshrc"
