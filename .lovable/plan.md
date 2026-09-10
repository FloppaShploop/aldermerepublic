# Fix game progress saving

## Goal
Make every embedded game persist each signed-in player’s progress and restore it after reopening or reloading.

## Changes
- Trace iframe bridge save/load messages and the authenticated progress write/read functions.
- Fix message handling, progress upsert, and restore timing without changing game behavior.
- Verify saving and reloading with the live preview and targeted tests.

## Technical details
- Keep progress scoped to the authenticated user and game.
- Preserve existing sandbox and external-link relay behavior.
