#!/usr/bin/env python3
"""
Match برای positions to our 31 lines.

We have 32 برای but 31 lines because:
- Line 5: "برای شرمندگی، برای بی پولی" has 2 برای
- Line 16: "برای دانش آموزا برای آینده" has 2 برای  
- Line 20: "برای این همه برای غیر تکراری" has 2 برای

So we need to merge برای positions 5+6, 17+18, and 22+23.
"""

import json

# Load data
with open('baraye_timestamps_backup_20260123_173401.json', 'r') as f:
    our_lines = json.load(f)

with open('output/baraye_whisperx_words.json', 'r') as f:
    whisperx = json.load(f)

words = whisperx['word_segments']

# Find all برای positions
baraye_positions = []
for i, w in enumerate(words):
    if w['word'] == 'برای':
        baraye_positions.append({
            'index': i,
            'start': w['start'],
            'end': w['end']
        })

print(f"Found {len(baraye_positions)} برای positions")

# Check which lines have 2 برای
double_baraye_lines = []
for line in our_lines:
    count = line['original'].count('برای')
    if count > 1:
        double_baraye_lines.append(line['lineNumber'])
        print(f"Line {line['lineNumber']} has {count} برای: {line['original'][:50]}...")

# Map برای positions to lines
# Lines with double برای: 5, 16, 20
# At positions 5+6 (0-indexed: 4+5), 17+18 (0-indexed: 16+17), 22+23 (0-indexed: 21+22)

line_to_baraye = {}
baraye_idx = 0

for line_num in range(1, 32):
    if baraye_idx >= len(baraye_positions):
        print(f"ERROR: Ran out of برای at line {line_num}")
        break
    
    line_to_baraye[line_num] = {
        'start_baraye_idx': baraye_idx,
        'start_time': baraye_positions[baraye_idx]['start']
    }
    
    # If this line has double برای, skip the next one
    if line_num in double_baraye_lines:
        baraye_idx += 2  # Skip both
    else:
        baraye_idx += 1

# Now calculate end times - each line ends when the next line starts (or at last word)
results = []

for line_num in range(1, 32):
    line_data = next((l for l in our_lines if l['lineNumber'] == line_num), None)
    if not line_data:
        continue
    
    start_time = line_to_baraye[line_num]['start_time']
    
    # End time is just before next line starts, or end of song
    if line_num < 31:
        # Find the word just before the next line's برای
        next_start_baraye_idx = line_to_baraye[line_num + 1]['start_baraye_idx']
        next_baraye_word_idx = baraye_positions[next_start_baraye_idx]['index']
        
        # The last word of this line is the one before next line's first برای
        if next_baraye_word_idx > 0:
            last_word_idx = next_baraye_word_idx - 1
            end_time = words[last_word_idx]['end']
        else:
            end_time = start_time + 3  # Fallback
    else:
        # Last line - ends at end of last word
        end_time = words[-1]['end']
    
    results.append({
        'lineNumber': line_num,
        'startTime': round(start_time, 2),
        'endTime': round(end_time, 2),
        'original': line_data['original']
    })
    
print("\n" + "=" * 90)
print("RESULTS: WhisperX-based timestamps")
print("=" * 90)
print(f"{'Line':<5} {'Start':<8} {'End':<8} {'Dur':<6} {'Text':<50}")
print("-" * 90)

for res in results:
    dur = res['endTime'] - res['startTime']
    text = res['original'][:47] + "..." if len(res['original']) > 50 else res['original']
    print(f"{res['lineNumber']:<5} {res['startTime']:<8.2f} {res['endTime']:<8.2f} {dur:<6.2f} {text}")

# Compare with original
print("\n" + "=" * 90)
print("COMPARISON: Original backup vs WhisperX")
print("=" * 90)
print(f"{'Line':<5} {'Orig Start':<12} {'WX Start':<12} {'Diff':<8} {'Notes'}")
print("-" * 90)

for res in results:
    orig = next((l for l in our_lines if l['lineNumber'] == res['lineNumber']), None)
    if orig:
        diff = res['startTime'] - orig['startTime']
        notes = ""
        if abs(diff) > 1:
            notes = "⚠️ >1s diff"
        print(f"{res['lineNumber']:<5} {orig['startTime']:<12.2f} {res['startTime']:<12.2f} {diff:+.2f}s   {notes}")

# Save results
with open('output/baraye_whisperx_timestamps.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"\nSaved to output/baraye_whisperx_timestamps.json")
