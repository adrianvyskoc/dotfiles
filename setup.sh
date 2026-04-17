#!/usr/bin/env bash
set -euo pipefail

DOTFILES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="$HOME/.my_aliases"
SOURCE_LINE='[ -f "$HOME/.my_aliases" ] && source "$HOME/.my_aliases"'

if [ -L "$TARGET" ] && [ "$(readlink "$TARGET")" = "$DOTFILES_DIR/.my_aliases" ]; then
  echo "Symlink already in place: $TARGET"
else
  ln -sfn "$DOTFILES_DIR/.my_aliases" "$TARGET"
  echo "Linked $TARGET -> $DOTFILES_DIR/.my_aliases"
fi

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
