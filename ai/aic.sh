# AI library dispatcher — sourced from ~/.my_aliases.
# Provides the `aic` command (= "AI copy") for copying assets out of ~/.ai/ into projects.

# ---- AI library ----
aic() {  ## copy AI asset from ~/.ai library (aic [name] [dest|--user|--global|--stdout|--append FILE])
  # Let empty globs produce nothing instead of an error (default in bash; zsh needs null_glob).
  [ -n "$ZSH_VERSION" ] && setopt localoptions null_glob

  local ai_dir="$HOME/.ai"
  if [ ! -d "$ai_dir" ]; then
    echo "aic: ~/.ai not found. Run setup.sh from the dotfiles repo." >&2
    return 1
  fi

  # List mode: no args or --list/-l
  if [ -z "$1" ] || [ "$1" = "--list" ] || [ "$1" = "-l" ]; then
    local cat cat_dir item name desc entries
    for cat in commands skills rules agents; do
      cat_dir="$ai_dir/$cat"
      [ -d "$cat_dir" ] || continue
      entries=()
      if [ "$cat" = "skills" ]; then
        for item in "$cat_dir"/*/SKILL.md; do
          [ -f "$item" ] || continue
          name=$(basename "$(dirname "$item")")
          desc=$(awk '/^description:/ { sub(/^description: */, ""); print; exit }' "$item")
          entries+=("  $name	$desc")
        done
      else
        for item in "$cat_dir"/*.md; do
          [ -f "$item" ] || continue
          name=$(basename "$item" .md)
          desc=$(awk '/^description:/ { sub(/^description: */, ""); print; exit }' "$item")
          entries+=("  $name	$desc")
        done
      fi
      if [ ${#entries[@]} -gt 0 ]; then
        printf '\n# %s\n' "$cat"
        printf '%s\n' "${entries[@]}" | column -t -s $'\t'
      fi
    done
    printf '\nUsage: aic <name> [dest]         copy into <dest>/.claude/ (rules: append to <dest>/CLAUDE.md)\n'
    printf '       aic <name> --user|-u       symlink into ~/.claude/ (alias --global; rules: append to ~/.claude/CLAUDE.md)\n'
    printf '       aic <name> --stdout        rules only: print to stdout\n'
    printf '       aic <name> --append FILE   rules only: append to a specific file\n'
    return 0
  fi

  # Parse args after name
  local name="$1"
  shift
  local mode="copy" dest="." append_file=""
  while [ $# -gt 0 ]; do
    case "$1" in
      --user|-u|--global|-g) mode="global"; shift ;;
      --stdout) mode="stdout"; shift ;;
      --append)
        mode="append"
        append_file="$2"
        if [ -z "$append_file" ]; then
          echo "aic: --append requires a file argument" >&2
          return 1
        fi
        shift 2
        ;;
      --*) echo "aic: unknown flag: $1" >&2; return 1 ;;
      *) dest="$1"; shift ;;
    esac
  done

  # Locate the asset across categories
  local category="" src="" c
  for c in commands rules agents; do
    if [ -f "$ai_dir/$c/$name.md" ]; then
      category="$c"
      src="$ai_dir/$c/$name.md"
      break
    fi
  done
  if [ -z "$category" ] && [ -f "$ai_dir/skills/$name/SKILL.md" ]; then
    category="skills"
    src="$ai_dir/skills/$name"
  fi
  if [ -z "$category" ]; then
    echo "aic: no asset named '$name'. Run 'aic' to see available assets." >&2
    return 1
  fi

  # Rules branch: append to a CLAUDE.md (or arbitrary file with --append, or stdout with --stdout)
  if [ "$category" = "rules" ]; then
    if [ "$mode" = "stdout" ]; then
      cat "$src"
      return 0
    fi
    local target_file
    case "$mode" in
      append) target_file="$append_file" ;;
      global) target_file="$HOME/.claude/CLAUDE.md" ;;
      copy)   target_file="$dest/CLAUDE.md" ;;
    esac
    mkdir -p "$(dirname "$target_file")"
    if [ -s "$target_file" ]; then
      printf '\n' >> "$target_file"
    fi
    cat "$src" >> "$target_file"
    echo "Appended $src -> $target_file"
    return 0
  fi

  # Non-rules: install into .claude/<category>/
  if [ "$mode" = "append" ] || [ "$mode" = "stdout" ]; then
    echo "aic: --append / --stdout only work for rules" >&2
    return 1
  fi

  # User scope (--user/--global): symlink back to ~/.ai so installs track the
  # dotfiles repo — edits and `git pull` propagate without re-running aic.
  if [ "$mode" = "global" ]; then
    local target="$HOME/.claude/$category"
    mkdir -p "$target"
    if [ "$category" = "skills" ]; then
      ln -sfn "$src" "$target/$name"
      echo "Linked $target/$name -> $src"
    else
      ln -sfn "$src" "$target/$name.md"
      echo "Linked $target/$name.md -> $src"
    fi
    return 0
  fi

  # Project scope: copy a self-contained snapshot so the project stays portable.
  local target="$dest/.claude/$category"
  mkdir -p "$target"
  if [ "$category" = "skills" ]; then
    cp -R "$src" "$target/"
    echo "Copied $src -> $target/$name/"
  else
    cp "$src" "$target/$name.md"
    echo "Copied $src -> $target/$name.md"
  fi
}
