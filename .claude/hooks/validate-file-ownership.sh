#!/bin/bash
# PreToolUse hook: Enforce file ownership during spec builds
#
# When PARE_SPEC_FILE is set, this hook reads the spec's "Files OWNED" list
# and blocks writes to any file not in that list. This prevents agents from
# accidentally modifying files outside their spec's boundary.
#
# When PARE_SPEC_FILE is not set (normal development), all writes are allowed.
#
# Exit codes:
#   0 = allow the write
#   2 = block the write (stderr shown to agent)

# Read hook input from stdin
INPUT=$(cat)

# Extract the file path being written
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
  # No file path in the tool call — allow (shouldn't happen for Edit/Write)
  exit 0
fi

# If no spec file is set, we're in normal dev mode — allow everything
if [ -z "$PARE_SPEC_FILE" ]; then
  exit 0
fi

# Check that the spec file exists
if [ ! -f "$PARE_SPEC_FILE" ]; then
  echo "Warning: PARE_SPEC_FILE=$PARE_SPEC_FILE does not exist. Allowing write." >&2
  exit 0
fi

# Extract "Files OWNED" section from the spec
# Looks for lines between "## Files OWNED" (or "### Files OWNED") and the next heading
OWNED_FILES=$(sed -n '/^#\+.*[Ff]iles OWNED/,/^#/{/^#\+.*[Ff]iles OWNED/d;/^#/d;p}' "$PARE_SPEC_FILE" | \
  grep -oE '`[^`]+`' | \
  tr -d '`' | \
  sed 's/^[[:space:]]*//' | \
  grep -v '^$')

# If we couldn't parse any owned files, warn but allow
if [ -z "$OWNED_FILES" ]; then
  echo "Warning: Could not parse Files OWNED from $PARE_SPEC_FILE. Allowing write." >&2
  exit 0
fi

# Normalize the file path (remove leading ./ or absolute prefix to get repo-relative)
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
NORMALIZED_PATH="$FILE_PATH"

# Strip repo root prefix if present
if [ -n "$REPO_ROOT" ]; then
  NORMALIZED_PATH="${FILE_PATH#$REPO_ROOT/}"
  NORMALIZED_PATH="${NORMALIZED_PATH#$REPO_ROOT\\}"
fi

# Strip leading ./
NORMALIZED_PATH="${NORMALIZED_PATH#./}"

# Check if the normalized path matches any owned file pattern
while IFS= read -r owned; do
  [ -z "$owned" ] && continue

  # Strip leading ./
  owned="${owned#./}"

  # Exact match
  if [ "$NORMALIZED_PATH" = "$owned" ]; then
    exit 0
  fi

  # Glob/prefix match (e.g., "packages/core/src/tools/*")
  # shellcheck disable=SC2254
  case "$NORMALIZED_PATH" in
    $owned) exit 0 ;;
  esac
done <<< "$OWNED_FILES"

# Also allow pipeline artifact writes (build logs, batch summaries)
case "$NORMALIZED_PATH" in
  pipeline/6-build/*) exit 0 ;;
  pipeline/5.5-prepare/*) exit 0 ;;
esac

# File is NOT in the owned list — block the write
cat <<EOF >&2
FILE OWNERSHIP VIOLATION
========================
Spec: $PARE_SPEC_FILE
File: $NORMALIZED_PATH
Tool: $(echo "$INPUT" | jq -r '.tool_name')

This file is NOT in the spec's "Files OWNED" list.
Only these files are allowed:
$(echo "$OWNED_FILES" | sed 's/^/  - /')

To fix: Either add this file to the spec's OWNED list,
or find the correct spec that owns this file.
EOF
exit 2
