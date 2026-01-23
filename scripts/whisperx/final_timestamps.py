#!/usr/bin/env python3
"""
Final timestamp mapping combining WhisperX data with backup for missing sections.

WhisperX gaps:
- 87.21s-93.33s: Missed lines 21-22 (use backup)
- 119.54s-124.11s: Normal pause before final "آزادی" section
"""

import json

# Load data
with open('baraye_timestamps_backup_20260123_173401.json', 'r') as f:
    backup = json.load(f)

with open('output/baraye_whisperx_words.json', 'r') as f:
    whisperx = json.load(f)

words = whisperx['word_segments']

# Find all برای positions
baraye_list = []
for i, w in enumerate(words):
    if w['word'] == 'برای':
        baraye_list.append({
            'idx': i,
            'start': w['start'],
            'end': w['end'],
            'next': words[i+1]['word'] if i+1 < len(words) else 'END'
        })

# Manual mapping based on analysis
# Lines with double برای: 5, 16, 20
# برای index → line number mapping

mapping = [
    # (line_num, baraye_indices, use_backup)
    (1, [0], False),      # برای #1 → Line 1
    (2, [1], False),      # برای #2 → Line 2
    (3, [2], False),      # برای #3 → Line 3
    (4, [3], False),      # برای #4 → Line 4
    (5, [4, 5], False),   # برای #5+#6 → Line 5 (double)
    (6, [6], False),      # برای #7 → Line 6
    (7, [7], False),      # برای #8 → Line 7
    (8, [8], False),      # برای #9 → Line 8
    (9, [9], False),      # برای #10 → Line 9
    (10, [10], False),    # برای #11 → Line 10
    (11, [11], False),    # برای #12 → Line 11
    (12, [12], False),    # برای #13 → Line 12
    (13, [13], False),    # برای #14 → Line 13
    (14, [14], False),    # برای #15 → Line 14
    (15, [15], False),    # برای #16 → Line 15
    (16, [16, 17], False),# برای #17+#18 → Line 16 (double)
    (17, [18], False),    # برای #19 → Line 17
    (18, [19], False),    # برای #20 → Line 18
    (19, [20], False),    # برای #21 → Line 19
    (20, [21, 22], False),# برای #22+#23 → Line 20 (double)
    (21, [], True),       # MISSING - use backup
    (22, [], True),       # PARTIALLY MISSING - use backup
    (23, [23], False),    # برای #24 → Line 23
    (24, [24], False),    # برای #25 → Line 24
    (25, [25], False),    # برای #26 → Line 25
    (26, [26], False),    # برای #27 → Line 26
    (27, [27], False),    # برای #28 → Line 27
    (28, [28], False),    # برای #29 → Line 28
    (29, [29], False),    # برای #30 → Line 29
    (30, [30], False),    # برای #31 → Line 30
    (31, [31], False),    # برای #32 → Line 31
]

results = []

for line_num, baraye_indices, use_backup in mapping:
    backup_line = next((l for l in backup if l['lineNumber'] == line_num), None)
    
    if use_backup or not baraye_indices:
        # Use backup timestamps
        results.append({
            'lineNumber': line_num,
            'startTime': backup_line['startTime'],
            'endTime': backup_line['endTime'],
            'original': backup_line['original'],
            'source': 'backup'
        })
    else:
        # Use WhisperX timestamps
        start_baraye = baraye_list[baraye_indices[0]]
        start_time = start_baraye['start']
        
        # End time: find last word before next line starts
        if line_num < 31:
            # Find next line's start
            next_mapping = mapping[line_num]  # 0-indexed so this is line_num+1
            if next_mapping[2]:  # Next line uses backup
                # Use backup end time
                end_time = backup_line['endTime']
            elif next_mapping[1]:  # Next line has برای indices
                next_baraye_idx = next_mapping[1][0]
                next_word_idx = baraye_list[next_baraye_idx]['idx']
                # End is the word before next برای
                last_word_idx = next_word_idx - 1
                end_time = words[last_word_idx]['end']
            else:
                end_time = backup_line['endTime']
        else:
            # Last line - ends at last word
            end_time = words[-1]['end']
        
        results.append({
            'lineNumber': line_num,
            'startTime': round(start_time, 2),
            'endTime': round(end_time, 2),
            'original': backup_line['original'],
            'source': 'whisperx'
        })

# Print results
print("=" * 100)
print("FINAL TIMESTAMPS (WhisperX + Backup hybrid)")
print("=" * 100)
print(f"{'Line':<5} {'Start':<8} {'End':<8} {'Dur':<6} {'Src':<10} {'Text':<50}")
print("-" * 100)

for res in results:
    dur = res['endTime'] - res['startTime']
    text = res['original'][:47] + "..." if len(res['original']) > 50 else res['original']
    print(f"{res['lineNumber']:<5} {res['startTime']:<8.2f} {res['endTime']:<8.2f} {dur:<6.2f} {res['source']:<10} {text}")

# Compare with backup
print("\n" + "=" * 100)
print("COMPARISON: Backup vs Final (WhisperX-enhanced)")
print("=" * 100)
print(f"{'Line':<5} {'Backup Start':<14} {'Final Start':<14} {'Diff':<10} {'Source'}")
print("-" * 100)

for res in results:
    backup_line = next((l for l in backup if l['lineNumber'] == res['lineNumber']), None)
    diff = res['startTime'] - backup_line['startTime']
    marker = ""
    if abs(diff) > 0.5:
        marker = "← CHANGED"
    print(f"{res['lineNumber']:<5} {backup_line['startTime']:<14.2f} {res['startTime']:<14.2f} {diff:+.2f}s    {res['source']} {marker}")

# Save final timestamps
with open('output/baraye_final_timestamps.json', 'w', encoding='utf-8') as f:
    json.dump([{
        'lineNumber': r['lineNumber'],
        'startTime': r['startTime'],
        'endTime': r['endTime'],
        'original': r['original']
    } for r in results], f, ensure_ascii=False, indent=2)

print(f"\n✅ Saved final timestamps to output/baraye_final_timestamps.json")
