#!/usr/bin/env bash
set -euo pipefail

# SongScript: Add a new song in one command
# Usage: ./add-song.sh "YOUTUBE_URL" -l fa
# Usage: ./add-song.sh "YOUTUBE_URL" -l ko --title "My Song" --artist "Artist Name"
# Usage: ./add-song.sh "YOUTUBE_URL" -l he --no-push  (dry run, no DB push)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$SCRIPT_DIR/venv"

# Check venv exists
if [ ! -d "$VENV_DIR" ]; then
    echo "ERROR: Virtual environment not found at $VENV_DIR"
    echo "Run: python3 -m venv $VENV_DIR && $VENV_DIR/bin/pip install -r $SCRIPT_DIR/requirements.txt"
    exit 1
fi

# Fix macOS temp directory (can go stale after Demucs subprocess)
export TMPDIR="${TMPDIR:-/tmp}"

# Fix SSL certs for Python 3.13 (macOS missing cert.pem)
if [ -z "${SSL_CERT_FILE:-}" ]; then
    SSL_CERT_DIR="$("$VENV_DIR/bin/python3" -c "import certifi; print(certifi.where())" 2>/dev/null || true)"
    if [ -n "$SSL_CERT_DIR" ]; then
        export SSL_CERT_FILE="$SSL_CERT_DIR"
    fi
fi

# Load Anthropic API key from 1Password
if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
    if command -v op &> /dev/null; then
        echo "Loading API key from 1Password..."
        export ANTHROPIC_API_KEY=$(op item get "ANTHROPIC_SONGSCRIPT_API_KEY" --fields credential --reveal 2>/dev/null || true)
        if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
            echo "WARNING: Could not load API key from 1Password. Transliteration will use basic fallback."
        fi
    else
        echo "WARNING: No ANTHROPIC_API_KEY set and 1Password CLI not found. Using basic transliteration."
    fi
fi

# Run the pipeline
echo "Starting SongScript pipeline..."
echo "================================"
"$VENV_DIR/bin/python3" "$SCRIPT_DIR/pipeline.py" "$@"
