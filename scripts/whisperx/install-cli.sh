#!/bin/bash
# Install songscript-whisperx CLI to user's bin directory

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="$HOME/.local/bin"
CLI_NAME="songscript-whisperx"

# Create install directory if it doesn't exist
mkdir -p "$INSTALL_DIR"

# Create symlink
echo "Installing $CLI_NAME to $INSTALL_DIR..."
ln -sf "$SCRIPT_DIR/$CLI_NAME" "$INSTALL_DIR/$CLI_NAME"

# Check if install dir is in PATH
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    echo ""
    echo "⚠️  WARNING: $INSTALL_DIR is not in your PATH"
    echo ""
    echo "Add this line to your ~/.bashrc or ~/.zshrc:"
    echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
    echo ""
fi

echo "✓ Installation complete!"
echo ""
echo "Usage:"
echo "  $CLI_NAME add <youtube_url> <language>"
echo "  $CLI_NAME extract <audio_file> <language>"
echo "  $CLI_NAME match <whisperx_output> --pattern <word>"
echo "  $CLI_NAME apply <timestamps_json> <song_id>"
echo ""
echo "Run '$CLI_NAME --help' for more information"
