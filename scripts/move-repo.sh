#!/bin/bash
# Move Pare Engine repo out of OneDrive to C:\dev\pare-engine
#
# WHY: OneDrive corrupts .git directories, locks files during sync,
# and will try to sync node_modules in every worktree. This breaks
# parallel builds via git worktrees.
#
# WHAT THIS DOES:
# 1. git clone --local to C:\dev\pare-engine (fast, copies .git objects)
# 2. Copies uncommitted working directory changes via tar
# 3. Verifies the copy (git status, pnpm build, pnpm test)
# 4. Leaves the original in place (you delete it manually after verifying)
#
# AFTER RUNNING:
# 1. Open a new terminal at C:\dev\pare-engine
# 2. Run: claude (to start a new Claude Code session)
# 3. Verify everything works
# 4. Once confirmed working, delete the OneDrive copy:
#    rm -rf "C:/Users/arafa/OneDrive/Desktop/pare-engine"
#
# OPTIONAL: Create a shortcut on Desktop pointing to C:\dev\pare-engine

set -e

SOURCE="C:/Users/arafa/OneDrive/Desktop/pare-engine"
TARGET="C:/dev/pare-engine"

echo "=== Pare Engine Repo Move ==="
echo "From: $SOURCE"
echo "To:   $TARGET"
echo ""

# Check source exists
if [ ! -d "$SOURCE/.git" ]; then
  echo "ERROR: Source directory does not contain a git repo"
  exit 1
fi

# Check target doesn't already exist
if [ -d "$TARGET" ]; then
  echo "ERROR: Target directory already exists: $TARGET"
  echo "Remove it first if you want to re-run: rm -rf '$TARGET'"
  exit 1
fi

# Create parent directory
mkdir -p "$(dirname "$TARGET")"

echo "Step 1: Cloning repo (fast local clone — copies .git objects)..."
git clone --local "$SOURCE" "$TARGET"

echo ""
echo "Step 2: Copying uncommitted changes (modified files)..."
cd "$SOURCE"
git diff --name-only > /tmp/pare-modified-files.txt
MODIFIED_COUNT=$(wc -l < /tmp/pare-modified-files.txt)
if [ "$MODIFIED_COUNT" -gt 0 ]; then
  tar cf - -T /tmp/pare-modified-files.txt 2>/dev/null | (cd "$TARGET" && tar xf - --no-same-owner)
  echo "  Copied $MODIFIED_COUNT modified files"
else
  echo "  No modified files to copy"
fi

echo ""
echo "Step 3: Copying untracked files..."
git ls-files --others --exclude-standard > /tmp/pare-untracked-files.txt
UNTRACKED_COUNT=$(wc -l < /tmp/pare-untracked-files.txt)
if [ "$UNTRACKED_COUNT" -gt 0 ]; then
  tar cf - -T /tmp/pare-untracked-files.txt 2>/dev/null | (cd "$TARGET" && tar xf - --no-same-owner)
  echo "  Copied $UNTRACKED_COUNT untracked files"
else
  echo "  No untracked files to copy"
fi

echo ""
echo "Step 4: Verifying git integrity..."
cd "$TARGET"
git status > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "  Git repo OK"
else
  echo "  ERROR: Git repo verification failed"
  exit 1
fi

echo ""
echo "Step 5: Installing dependencies..."
PATH="/c/Users/arafa/AppData/Roaming/npm:/c/Users/arafa/AppData/Local/pnpm:/c/Program Files/nodejs:/usr/bin:/bin:/c/Windows/System32:$PATH"
PNPM_HOME="/c/Users/arafa/AppData/Local/pnpm"
export PNPM_HOME
pnpm install --frozen-lockfile

echo ""
echo "=== Move complete ==="
echo ""
echo "Next steps:"
echo "  1. Open a new terminal at: C:\\dev\\pare-engine"
echo "  2. Run: claude"
echo "  3. Verify: git log --oneline -5 && pnpm build && pnpm test"
echo "  4. Once verified, delete the old copy:"
echo "     rm -rf 'C:/Users/arafa/OneDrive/Desktop/pare-engine'"
echo ""
echo "Your new repo is at: C:\\dev\\pare-engine"
