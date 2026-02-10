#!/usr/bin/env python3
"""
Push pipeline output to Convex database.
Reads the JSON output from pipeline.py and creates a song + lyrics via CLI.
"""

import json
import subprocess
import sys
import argparse
from pathlib import Path


def run_convex(function: str, args_json: str) -> str:
    """Run a Convex function via CLI and return the result."""
    cmd = ["npx", "convex", "run", function, args_json]
    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        cwd=str(Path(__file__).resolve().parent.parent.parent),  # songscript root
    )
    if result.returncode != 0:
        raise RuntimeError(f"Convex run failed: {result.stderr}")
    return result.stdout.strip()


def push_song(pipeline_json: dict, title: str = None, artist: str = None) -> str:
    """
    Push a pipeline result to Convex.

    Args:
        pipeline_json: Full pipeline output dict
        title: Override song title (optional)
        artist: Override artist name (optional)

    Returns:
        Convex song ID
    """
    video_info = pipeline_json.get("videoInfo", {})
    language = pipeline_json.get("language", "unknown")
    lines = pipeline_json.get("lines", [])

    song_title = title or video_info.get("title", "Unknown Song")
    song_artist = artist or video_info.get("artist", "Unknown Artist")

    # Extract YouTube video ID from URL
    url = pipeline_json.get("url", "")
    youtube_id = ""
    if "v=" in url:
        youtube_id = url.split("v=")[1].split("&")[0]
    elif "youtu.be/" in url:
        youtube_id = url.split("youtu.be/")[1].split("?")[0]

    # Step 1: Create the song
    print(f"\nCreating song: {song_title} by {song_artist}")
    create_args = json.dumps({
        "title": song_title,
        "artist": song_artist,
        "youtubeId": youtube_id,
        "sourceLanguage": language,
    })

    song_id_raw = run_convex("songs:create", create_args)
    # npx convex run prints the return value — parse it
    # It might be quoted or wrapped, extract the ID string
    song_id = song_id_raw.strip().strip('"').strip("'")
    print(f"Song created with ID: {song_id}")

    # Step 2: Create lyrics
    lyrics_data = []
    for line in lines:
        lyric = {
            "lineNumber": line.get("lineNumber", 0),
            "startTime": line.get("startTime", 0),
            "endTime": line.get("endTime", 0),
            "original": line.get("original", ""),
            "transliteration": line.get("transliteration", ""),
            "english": line.get("english", ""),
        }
        if line.get("hebrew"):
            lyric["hebrew"] = line["hebrew"]
        lyrics_data.append(lyric)

    if lyrics_data:
        print(f"Inserting {len(lyrics_data)} lyric lines...")
        lyrics_args = json.dumps({
            "songId": song_id,
            "lyrics": lyrics_data,
        })
        run_convex("lyrics:createMany", lyrics_args)
        print(f"Lyrics inserted successfully")

    # Step 3: Create words (batched per line)
    word_count = 0
    for line in lines:
        words = line.get("words", [])
        if not words:
            continue
        word_batch = []
        for i, word in enumerate(words):
            word_batch.append({
                "lineNumber": line.get("lineNumber", 0),
                "wordIndex": i,
                "persian": word.get("word", ""),
                "transliteration": word.get("transliteration", ""),
                "hebrew": word.get("hebrew", ""),
                "english": word.get("english", ""),
            })
        try:
            batch_args = json.dumps({"songId": song_id, "words": word_batch})
            run_convex("words:createMany", batch_args)
            word_count += len(word_batch)
        except RuntimeError as e:
            if word_count == 0:
                print(f"words:createMany not available, skipping word insertion")
                break
            raise

    if word_count > 0:
        print(f"Inserted {word_count} words")

    print(f"\nDone! Song '{song_title}' is now in SongScript.")
    print(f"Song ID: {song_id}")
    return song_id


def main():
    parser = argparse.ArgumentParser(description="Push pipeline output to Convex")
    parser.add_argument("json_file", help="Path to pipeline output JSON")
    parser.add_argument("--title", help="Override song title")
    parser.add_argument("--artist", help="Override artist name")
    parser.add_argument("--dry-run", action="store_true", help="Print what would be pushed without pushing")

    args = parser.parse_args()

    with open(args.json_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    if args.dry_run:
        video_info = data.get("videoInfo", {})
        lines = data.get("lines", [])
        print(f"DRY RUN — would push:")
        print(f"  Title: {args.title or video_info.get('title', 'Unknown')}")
        print(f"  Artist: {args.artist or video_info.get('artist', 'Unknown')}")
        print(f"  Language: {data.get('language', '?')}")
        print(f"  Lines: {len(lines)}")
        print(f"  Words: {sum(len(l.get('words', [])) for l in lines)}")
        if lines:
            print(f"\n  First line: {lines[0].get('original', '')}")
            print(f"  Transliteration: {lines[0].get('transliteration', '')}")
        return

    push_song(data, title=args.title, artist=args.artist)


if __name__ == "__main__":
    main()
