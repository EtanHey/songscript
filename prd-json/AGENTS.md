# AI Agent Instructions for PRD

## ⚠️ NEVER EDIT index.json DIRECTLY

To add/modify stories, use `update.json`:

1. Create story files in `stories/`
2. Write changes to `update.json` (not index.json!)
3. Ralph merges automatically on next run

## Example update.json

```json
{
  "storyOrder": ["...existing IDs...", "NEW-001", "NEW-002"],
  "pending": ["...existing pending...", "NEW-001", "NEW-002"],
  "stats": { "total": 31, "pending": 9 }
}
```

## Story ID Rules

- **Check `archive/` for used IDs** before creating new ones
- Use next available number (e.g., if US-033 in archive, use US-034)
- BUG-XXX for bugs, US-XXX for features, V-XXX for verification

## How update.json Works

Ralph runs `_ralph_apply_update_queue()` which:
1. Merges update.json INTO index.json (update.json fields win)
2. Deletes update.json after successful merge
3. Logs "📥 Applied queued updates from update.json"

## Current Archive Max IDs

Check before creating stories:
```bash
ls archive/ | grep -E "^US-[0-9]+" | sort -t'-' -k2 -n | tail -1
ls archive/ | grep -E "^BUG-[0-9]+" | sort -t'-' -k2 -n | tail -1
```
