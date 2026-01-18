#!/bin/bash

# =============================================================================
# Audio Snippet Extraction Script for SongScript
# =============================================================================
# This script extracts audio snippets from a full song file based on timestamps.
#
# PREREQUISITES:
#   1. Install ffmpeg: brew install ffmpeg
#   2. Install jq (for JSON parsing): brew install jq
#   3. Download the full audio using yt-dlp (one-time manual step):
#      yt-dlp -x --audio-format mp3 --audio-quality 192 \
#        "https://youtube.com/watch?v=xLvUEF2zpj8" -o baraye_full.mp3
#
# USAGE:
#   ./scripts/extract-snippets.sh <timestamps.json> <full_audio.mp3>
#
# EXAMPLE:
#   ./scripts/extract-snippets.sh scripts/baraye-timestamps.json baraye_full.mp3
#
# OUTPUT:
#   Creates snippets in public/audio/{songSlug}/ directory
#   Each snippet named: {songSlug}_{lineNumber:03d}.mp3
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check arguments
if [ "$#" -ne 2 ]; then
    echo -e "${RED}Error: Missing arguments${NC}"
    echo "Usage: $0 <timestamps.json> <full_audio.mp3>"
    echo "Example: $0 scripts/baraye-timestamps.json baraye_full.mp3"
    exit 1
fi

TIMESTAMPS_FILE="$1"
FULL_AUDIO="$2"

# Check if files exist
if [ ! -f "$TIMESTAMPS_FILE" ]; then
    echo -e "${RED}Error: Timestamps file not found: $TIMESTAMPS_FILE${NC}"
    exit 1
fi

if [ ! -f "$FULL_AUDIO" ]; then
    echo -e "${RED}Error: Full audio file not found: $FULL_AUDIO${NC}"
    echo ""
    echo "To download the audio, run:"
    echo "  yt-dlp -x --audio-format mp3 --audio-quality 192 \\"
    echo "    \"https://youtube.com/watch?v=\$(jq -r '.song.youtubeId' $TIMESTAMPS_FILE)\" -o $FULL_AUDIO"
    exit 1
fi

# Check for required tools
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${RED}Error: ffmpeg is not installed${NC}"
    echo "Install with: brew install ffmpeg"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is not installed${NC}"
    echo "Install with: brew install jq"
    exit 1
fi

# Parse song info from JSON
SONG_SLUG=$(jq -r '.song.slug' "$TIMESTAMPS_FILE")
SONG_TITLE=$(jq -r '.song.title' "$TIMESTAMPS_FILE")
SONG_ARTIST=$(jq -r '.song.artist' "$TIMESTAMPS_FILE")
TOTAL_LINES=$(jq '.lyrics | length' "$TIMESTAMPS_FILE")

echo "=============================================="
echo -e "${GREEN}Audio Snippet Extraction${NC}"
echo "=============================================="
echo "Song: $SONG_TITLE by $SONG_ARTIST"
echo "Slug: $SONG_SLUG"
echo "Total lines: $TOTAL_LINES"
echo "=============================================="
echo ""

# Create output directory
OUTPUT_DIR="public/audio/$SONG_SLUG"
mkdir -p "$OUTPUT_DIR"
echo -e "${YELLOW}Output directory: $OUTPUT_DIR${NC}"
echo ""

# Track total size
TOTAL_SIZE=0
EXTRACTED_COUNT=0

# Extract each snippet
for i in $(seq 0 $((TOTAL_LINES - 1))); do
    LINE_NUMBER=$(jq ".lyrics[$i].lineNumber" "$TIMESTAMPS_FILE")
    START_TIME=$(jq ".lyrics[$i].startTime" "$TIMESTAMPS_FILE")
    END_TIME=$(jq ".lyrics[$i].endTime" "$TIMESTAMPS_FILE")

    # Calculate duration (with scale=2 for proper decimal handling)
    # Use awk for more reliable floating point math
    DURATION=$(awk "BEGIN {printf \"%.2f\", $END_TIME - $START_TIME}")

    # Format line number with leading zeros (001, 002, etc.)
    LINE_NUM_PADDED=$(printf "%03d" "$LINE_NUMBER")

    # Output filename
    OUTPUT_FILE="$OUTPUT_DIR/${SONG_SLUG}_${LINE_NUM_PADDED}.mp3"

    echo -n "Extracting line $LINE_NUMBER (${START_TIME}s - ${END_TIME}s, ${DURATION}s)... "

    # Extract snippet using ffmpeg
    # -ss: start time (placed before -i for fast seeking)
    # -t: duration
    # -c:a libmp3lame: re-encode as MP3 (needed for precise cuts)
    # -b:a 192k: 192 kbps bitrate
    # -y: overwrite output file
    ffmpeg -y -ss "$START_TIME" -i "$FULL_AUDIO" -t "$DURATION" \
        -c:a libmp3lame -b:a 192k \
        "$OUTPUT_FILE" 2>/dev/null

    # Get file size
    FILE_SIZE=$(stat -f%z "$OUTPUT_FILE" 2>/dev/null || stat --printf="%s" "$OUTPUT_FILE" 2>/dev/null)
    FILE_SIZE_KB=$((FILE_SIZE / 1024))
    TOTAL_SIZE=$((TOTAL_SIZE + FILE_SIZE))
    EXTRACTED_COUNT=$((EXTRACTED_COUNT + 1))

    echo -e "${GREEN}Done${NC} (${FILE_SIZE_KB}KB)"
done

# Convert total size to MB
TOTAL_SIZE_MB=$(echo "scale=2; $TOTAL_SIZE / 1024 / 1024" | bc)

echo ""
echo "=============================================="
echo -e "${GREEN}Extraction Complete!${NC}"
echo "=============================================="
echo "Extracted: $EXTRACTED_COUNT snippets"
echo "Total size: ${TOTAL_SIZE_MB}MB"
echo "Output: $OUTPUT_DIR/"
echo "=============================================="

# List files
echo ""
echo "Generated files:"
ls -la "$OUTPUT_DIR/"
