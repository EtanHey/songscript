# PRD Story Extraction Summary

**Lines Extracted:** 1201-1800 from PRD.md

**Total Stories:** 32

## Complete Stories (25)
1. **US-LOAD-FIX** - Fix Dynamic Import and Initial Load Errors
   - Status: ✅ COMPLETE (9/9 criteria checked)
   - All acceptance criteria met

2. **US-022** - Download Correct Baraye Video
   - Status: ✅ COMPLETE (5/5 criteria checked)

3. **US-023** - Get Timestamps for New Video
   - Status: ✅ COMPLETE (6/6 criteria checked)

4. **US-024** - Update Seed Data with New Video + Timestamps
   - Status: ✅ COMPLETE (8/8 criteria checked)

5. **US-025** - Extract Audio Snippets from New Video
   - Status: ✅ COMPLETE (6/6 criteria checked)

6. **US-026** - Local Video Player with Muted Video + Audio Snippets
   - Status: ✅ COMPLETE (9/9 criteria checked)

7. **US-027** - Full Video Playback Mode
   - Status: ✅ COMPLETE (7/7 criteria checked)

8. **V-007** - Verify New Video + Audio System
   - Status: ✅ COMPLETE (10/10 criteria checked)

9. **US-028** - Three-Way Playback Toggle (Single/Loop/Fluid)
   - Status: ✅ COMPLETE (9/9 criteria checked)

10. **US-029** - Pause/Play Controls
    - Status: ✅ COMPLETE (7/7 criteria checked)

11. **US-030** - Word-by-Word Info Modal
    - Status: ✅ COMPLETE (8/8 criteria checked)

12. **US-032** - Word Learning Tracking
    - Status: ✅ COMPLETE (7/7 criteria checked)

13. **US-033** - Pre-generate Word Data for Baraye
    - Status: ✅ COMPLETE (7/7 criteria checked)

14. **V-008** - Verify Playback Modes
    - Status: ✅ COMPLETE (9/9 criteria checked)

15. **US-VIDEO-LOAD** - Fix Video Behavior on Page Load
    - Status: ✅ COMPLETE (10/10 criteria checked)

16. **US-MOBILE-DRAWER** - Redesign Mobile Word Info Experience
    - Status: ✅ COMPLETE (11/11 criteria checked)

17. **US-MOBILE-LAYOUT** - Mobile Controls Layout Fix
    - Status: ✅ COMPLETE (6/6 criteria checked)

18. **US-VIDEO-MOBILE** - Collapsible Video on Mobile
    - Status: ✅ COMPLETE (12/12 criteria checked)

19. **US-WORD-SYNC** - Sync Learning State for Repeated Words
    - Status: ✅ COMPLETE (6/6 criteria checked)

20. **V-009** - Verify Word Info Modal
    - Status: ✅ COMPLETE (7/7 criteria checked)

21. **US-WORD-TOKEN** - Words as Database Tokens (Schema Refactor)
    - Status: ✅ COMPLETE (7/7 criteria checked)

22. **US-WORD-TOKEN-FIX** - Migrate and Sync Word States
    - Status: ✅ COMPLETE (7/7 criteria checked)

23. **V-WORD-TOKEN** - Audit Word Sync Across All Lines
    - Status: ✅ COMPLETE (9/9 criteria checked)

## Pending Stories (6)
1. **US-LOAD-FIX-TESTS** - Tests for Route Loading
   - Status: ⏳ PENDING (0/7 criteria checked)

2. **US-AUTOPLAY** - Auto-Play Video + Fluid Mode on Page Load
   - Status: ⏳ PENDING (0/7 criteria checked)

3. **US-AUTOPLAY-TESTS** - Tests for Auto-Play and Fluid Mode
   - Status: ⏳ PENDING (0/9 criteria checked)

4. **US-LOOP-UX** - Fix Loop Mode Line Flashing
   - Status: ⏳ PENDING (0/7 criteria checked)

5. **US-LOOP-UX-TESTS** - Tests for Loop Mode
   - Status: ⏳ PENDING (0/7 criteria checked)

6. **V-AUTOPLAY** - Verify Auto-Play, Fluid Mode, and Loop UX
   - Status: ⏳ PENDING (0/8 criteria checked)

## Blocked Stories (1)
1. **US-031** - ElevenLabs Word Audio Generation (LAST - needs API key)
   - Status: 🚫 BLOCKED
   - Blocker: ELEVENLABS_API_KEY not found in .env.local. User must provide API key from https://elevenlabs.io/ to proceed.
   - Criteria: 0/11 checked

## JSON File Locations
All story JSON files are located in:
```
/Users/etanheyman/Desktop/Gits/songscript/prd-json/stories/
```

## File Format
Each story is stored as a JSON file with the following structure:
```json
{
  "id": "STORY-ID",
  "title": "Story Title",
  "description": "Full description from PRD",
  "acceptanceCriteria": [
    {
      "text": "Criterion text",
      "checked": true/false
    }
  ],
  "passes": true/false,
  "blockedBy": null or "reason string"
}
```

## Statistics
- **Total Stories Extracted:** 32
- **Complete & Passing:** 25 (78%)
- **Pending:** 6 (19%)
- **Blocked:** 1 (3%)
- **Total Acceptance Criteria:** 249
- **Criteria Met:** 224 (90%)
