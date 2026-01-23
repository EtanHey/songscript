#!/usr/bin/env python3
"""
Match our 31 lines to WhisperX word-level timestamps.

Strategy:
1. For each line, extract its words
2. Find the first word of the line in WhisperX (starting from where we left off)
3. The line starts at that word's timestamp
4. The line ends at the last word before the next line starts
"""

import json
import re
from difflib import SequenceMatcher

def normalize_persian(text):
    """Normalize Persian text for comparison."""
    # Remove diacritics, normalize characters
    text = text.strip()
    # Common normalization: ی vs ي, ک vs ك, etc.
    replacements = {
        'ي': 'ی',
        'ك': 'ک',
        'ة': 'ه',
        'ؤ': 'و',
        'أ': 'ا',
        'إ': 'ا',
        'ٱ': 'ا',
        'ـ': '',  # Remove tatweel (kashida)
        '\u200c': '',  # Zero-width non-joiner
        ',': '',
        '،': '',
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text

def similarity(a, b):
    """Calculate similarity between two strings."""
    return SequenceMatcher(None, normalize_persian(a), normalize_persian(b)).ratio()

def find_word_in_sequence(target_word, words, start_idx, max_lookahead=15):
    """Find a word in the sequence, allowing for transcription differences."""
    target = normalize_persian(target_word)
    best_match = None
    best_score = 0.6  # Minimum threshold
    
    for i in range(start_idx, min(start_idx + max_lookahead, len(words))):
        word = normalize_persian(words[i]['word'])
        score = similarity(target, word)
        if score > best_score:
            best_score = score
            best_match = i
        if score > 0.95:  # Good enough match
            break
    
    return best_match

def main():
    # Load our 31 lines
    with open('baraye_timestamps_backup_20260123_173401.json', 'r') as f:
        our_lines = json.load(f)
    
    # Load WhisperX words
    with open('output/baraye_whisperx_words.json', 'r') as f:
        whisperx = json.load(f)
    
    words = whisperx['word_segments']
    
    # Skip the first word (موسیقی - intro label)
    word_idx = 1
    
    results = []
    
    for line in our_lines:
        line_num = line['lineNumber']
        line_text = line['original']
        
        # Split line into words
        line_words = line_text.split()
        
        if not line_words:
            continue
        
        # Find first word of this line
        first_word = line_words[0]
        first_match_idx = find_word_in_sequence(first_word, words, word_idx)
        
        if first_match_idx is None:
            print(f"WARNING: Could not find start of line {line_num}: {first_word}")
            # Try harder - look for برای
            for i in range(word_idx, min(word_idx + 20, len(words))):
                if normalize_persian(words[i]['word']) == 'برای':
                    first_match_idx = i
                    break
        
        if first_match_idx is None:
            print(f"SKIPPING line {line_num}")
            continue
        
        # Get start time from first word
        start_time = words[first_match_idx]['start']
        
        # Find the last word of this line
        # We'll look ahead to find all matching words until we hit the next line's start
        last_match_idx = first_match_idx
        
        # Try to match subsequent words in the line
        current_idx = first_match_idx + 1
        for lw in line_words[1:]:
            match = find_word_in_sequence(lw, words, current_idx, max_lookahead=5)
            if match is not None:
                last_match_idx = match
                current_idx = match + 1
            else:
                # Word not found, might be transcription difference
                # Just advance by 1
                if current_idx < len(words):
                    last_match_idx = current_idx
                    current_idx += 1
        
        # Get end time from last matched word
        end_time = words[last_match_idx]['end']
        
        # Store result
        results.append({
            'lineNumber': line_num,
            'startTime': round(start_time, 2),
            'endTime': round(end_time, 2),
            'original': line_text,
            'whisperx_first_word': words[first_match_idx]['word'],
            'whisperx_last_word': words[last_match_idx]['word'],
            'first_word_idx': first_match_idx,
            'last_word_idx': last_match_idx
        })
        
        # Move word_idx past this line for next iteration
        word_idx = last_match_idx + 1
        
        print(f"Line {line_num:2}: {start_time:6.2f}s - {end_time:6.2f}s | {line_text[:40]}...")
    
    # Save results
    with open('output/baraye_matched_timestamps.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\nSaved {len(results)} lines to output/baraye_matched_timestamps.json")
    
    # Also create a simple format for easy comparison
    print("\n" + "=" * 80)
    print("COMPARISON: Original vs WhisperX timestamps")
    print("=" * 80)
    print(f"{'Line':<5} {'Original Start':<15} {'WhisperX Start':<15} {'Diff':<10}")
    print("-" * 50)
    
    for res in results:
        orig_line = next((l for l in our_lines if l['lineNumber'] == res['lineNumber']), None)
        if orig_line:
            orig_start = orig_line['startTime']
            wx_start = res['startTime']
            diff = wx_start - orig_start
            print(f"{res['lineNumber']:<5} {orig_start:<15.2f} {wx_start:<15.2f} {diff:+.2f}s")

if __name__ == '__main__':
    main()
