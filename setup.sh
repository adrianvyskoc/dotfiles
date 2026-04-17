#!/usr/bin/env bash
set -euo pipefail

DOTFILES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_LINE='[ -f "$HOME/.my_aliases" ] && source "$HOME/.my_aliases"'

link_file() {
  local src="$1" dest="$2"
  if [ -L "$dest" ] && [ "$(readlink "$dest")" = "$src" ]; then
    echo "Symlink already in place: $dest"
  else
    ln -sfn "$src" "$dest"
    echo "Linked $dest -> $src"
  fi
}

link_file "$DOTFILES_DIR/.my_aliases"         "$HOME/.my_aliases"
link_file "$DOTFILES_DIR/.my_aliases.machine" "$HOME/.my_aliases.machine"

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
