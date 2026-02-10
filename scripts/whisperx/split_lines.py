#!/usr/bin/env python3
"""
Split long WhisperX segments into proper lyric lines.

WhisperX often lumps many lines into single segments. This module
splits them using gaps between words as natural line boundaries.

Language-agnostic: works purely on word timestamps.
"""

from typing import List, Dict, Any


def split_lines(
    lines: List[Dict[str, Any]],
    min_gap: float = 0.15,
    max_line_duration: float = 4.5,
    min_line_duration: float = 1.5,
    min_confidence: float = 0.1,
) -> List[Dict[str, Any]]:
    """
    Split long segments into proper lyric lines based on word timing gaps.

    Args:
        lines: WhisperX formatted lines (from format_output)
        min_gap: Minimum gap (seconds) between words to consider a line break
        max_line_duration: Force-split lines longer than this (seconds)
        min_line_duration: Don't create lines shorter than this (seconds)
        min_confidence: Filter words with avg score below this

    Returns:
        New list of lines with proper splits
    """
    # Collect all words from all segments, sorted by time
    all_words = []
    for line in lines:
        for word in line.get("words", []):
            if word.get("word", "").strip():
                all_words.append(word)

    if not all_words:
        return lines

    # Sort by start time
    all_words.sort(key=lambda w: w.get("start", 0))

    # Filter out garbage words (very low confidence isolated words)
    filtered_words = []
    for w in all_words:
        score = w.get("score")
        if score is None or score >= 0.05:
            filtered_words.append(w)

    if not filtered_words:
        return lines

    # Build lines by splitting at gaps
    new_lines = []
    current_words = [filtered_words[0]]

    for i in range(1, len(filtered_words)):
        prev_end = filtered_words[i - 1].get("end", 0)
        curr_start = filtered_words[i].get("start", 0)
        gap = curr_start - prev_end

        current_duration = curr_start - current_words[0].get("start", 0)

        should_split = False

        # Split on gaps when line is long enough
        if gap >= min_gap and current_duration >= min_line_duration:
            should_split = True

        # Force split if line exceeds max duration — split at largest internal gap
        if current_duration >= max_line_duration and not should_split:
            best_split = _find_best_split(current_words)
            if best_split is not None:
                new_lines.append(_words_to_line(current_words[:best_split], 0))
                current_words = current_words[best_split:]
            current_words.append(filtered_words[i])
            continue

        if should_split:
            new_lines.append(_words_to_line(current_words, 0))
            current_words = [filtered_words[i]]
        else:
            current_words.append(filtered_words[i])

    # Don't forget the last line
    if current_words:
        new_lines.append(_words_to_line(current_words, 0))

    # Merge short lines into the next line (orphan words belong to next phrase)
    merged = []
    i = 0
    while i < len(new_lines):
        line = new_lines[i]
        words = line.get("words", [])
        duration = line["endTime"] - line["startTime"]

        # If line is too short and has next line, merge forward
        if duration < min_line_duration and len(words) <= 2 and i + 1 < len(new_lines):
            next_line = new_lines[i + 1]
            next_words = words + next_line.get("words", [])
            new_lines[i + 1] = _words_to_line(next_words, 0)
            i += 1
            continue

        merged.append(line)
        i += 1

    # Filter garbage lines (low confidence single/double words)
    result = []
    for line in merged:
        words = line.get("words", [])
        if not words:
            continue
        scores = [w.get("score", 1.0) for w in words if w.get("score") is not None]
        avg_score = sum(scores) / len(scores) if scores else 1.0
        if avg_score < min_confidence and len(words) <= 2:
            continue
        result.append(line)

    # Renumber
    for i, line in enumerate(result):
        line["lineNumber"] = i + 1

    return result


def _find_best_split(words: List[Dict]) -> int | None:
    """Find the index with the largest gap to split a long line."""
    if len(words) < 2:
        return None

    best_idx = None
    best_gap = -1.0

    for i in range(1, len(words)):
        prev_end = words[i - 1].get("end", 0)
        curr_start = words[i].get("start", 0)
        gap = curr_start - prev_end
        if gap > best_gap:
            best_gap = gap
            best_idx = i

    return best_idx


def _words_to_line(words: List[Dict], line_number: int) -> Dict[str, Any]:
    """Convert a list of words into a formatted line."""
    text_parts = [w.get("word", "") for w in words]
    return {
        "lineNumber": line_number,
        "startTime": round(words[0].get("start", 0), 3),
        "endTime": round(words[-1].get("end", 0), 3),
        "original": " ".join(text_parts),
        "words": words,
    }
