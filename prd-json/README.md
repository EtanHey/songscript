# PRD Stories in JSON Format

This directory contains all stories from PRD.md extracted into individual JSON files for easier programmatic access.

## File Structure

### Directory Layout
```
prd-json/
├── README.md              (this file)
├── EXTRACTION_SUMMARY.md  (summary of extraction)
└── stories/
    ├── US-001.json
    ├── US-002.json
    ├── US-003.json
    ├── ...
    └── V-AUTOPLAY.json
```

## JSON Schema

Each story file follows this structure:

```json
{
  "id": "US-001",
  "title": "Story Title",
  "description": "Full description of the story",
  "acceptanceCriteria": [
    {
      "text": "Criterion text",
      "checked": true
    },
    {
      "text": "Another criterion",
      "checked": false
    }
  ],
  "passes": true,
  "blockedBy": null
}
```

### Field Definitions

- **id** (string): Unique story identifier (US-XXX, V-XXX, or custom like US-TIMESTAMPS)
- **title** (string): Story title extracted from markdown header
- **description** (string): Full description text from the story
- **acceptanceCriteria** (array): List of acceptance criteria
  - **text** (string): Criterion description
  - **checked** (boolean): Whether criterion is complete (from `[x]` or `[ ]`)
- **passes** (boolean): True if ALL criteria are checked (`[x]`), false otherwise
- **blockedBy** (string | null): Explanation if story is blocked, null if not blocked

## Stories Extracted from Lines 181-600

Total: 15 stories extracted from the specified range

### Completed Stories (13)
- US-TIMESTAMPS
- US-SYNC-FIX
- US-TIMESTAMPS-V2
- US-029-FIX
- US-001
- US-002
- US-003
- US-004
- US-006
- US-007
- US-008
- US-009
- US-010

### Blocked Stories (2)
- US-005-FIX: Auth endpoints still return 500
- US-005: Auth API endpoints return 500 or hang indefinitely

## Usage

### Load a story in Python:
```python
import json

with open('stories/US-001.json') as f:
    story = json.load(f)
    
print(f"ID: {story['id']}")
print(f"Title: {story['title']}")
print(f"Complete: {story['passes']}")
for criterion in story['acceptanceCriteria']:
    status = "✓" if criterion['checked'] else "✗"
    print(f"  {status} {criterion['text']}")
```

### List all stories:
```bash
ls stories/ | sort
```

### Get completion stats:
```bash
echo "Total stories:" $(ls stories/ | wc -l)
echo "Completed:" $(grep '"passes": true' stories/*.json | wc -l)
echo "Blocked:" $(grep '"passes": false' stories/*.json | wc -l)
```

## Notes

- Stories are extracted from `/Users/etanheyman/Desktop/Gits/songscript/PRD.md`
- Lines 181-600 contain 15 distinct stories
- Additional stories exist in the full PRD beyond line 600
- All JSON files are valid and properly formatted
- The `passes` field is computed from acceptance criteria completion status
