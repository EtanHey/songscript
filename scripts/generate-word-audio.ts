#!/usr/bin/env bun
/**
 * ElevenLabs Word Audio Generation Script
 *
 * Generates pronunciation audio for unique Persian words using ElevenLabs TTS API.
 *
 * Prerequisites:
 *   1. Set ELEVENLABS_API_KEY in .env.local
 *   2. Install dependencies: bun install
 *
 * Usage:
 *   bun run scripts/generate-word-audio.ts
 *
 * Output:
 *   Creates MP3 files in public/audio/words/{encoded_persian}.mp3
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

// Load environment variables from .env.local
const envPath = join(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
const envVars: Record<string, string> = {};
envContent.split("\n").forEach((line) => {
  const [key, ...valueParts] = line.split("=");
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join("=").trim();
  }
});

const ELEVENLABS_API_KEY = envVars.ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
  console.error("Error: ELEVENLABS_API_KEY not found in .env.local");
  process.exit(1);
}

// ElevenLabs API configuration
const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";
const MODEL_ID = "eleven_multilingual_v2"; // Supports Persian/Farsi

// Voice settings for clear pronunciation
const VOICE_SETTINGS = {
  stability: 0.65, // Slightly higher for more consistent pronunciation
  similarity_boost: 0.75,
  style: 0.0, // Neutral style for clear speech
  use_speaker_boost: true,
};

// Output directory
const OUTPUT_DIR = join(process.cwd(), "public/audio/words");

interface Word {
  persian: string;
  transliteration: string;
  hebrew: string;
  english: string;
  grammarType: string;
}

interface WordLine {
  lineNumber: number;
  words: Word[];
}

interface WordsData {
  songSlug: string;
  lines: WordLine[];
}

/**
 * Encode Persian text for safe filename (URL-safe base64)
 */
function encodeFilename(persian: string): string {
  // Use URL-safe base64 encoding for the Persian text
  const encoded = Buffer.from(persian, "utf-8").toString("base64url");
  return encoded;
}

/**
 * Decode filename back to Persian text (for debugging)
 * Example: _decodeFilename("2KjYsdin24w") => "برای"
 */
function _decodeFilename(encoded: string): string {
  return Buffer.from(encoded, "base64url").toString("utf-8");
}

// Keep for debugging - log it to silence compiler warning
if (false) console.log(_decodeFilename);

/**
 * List available voices and find one suitable for Persian
 */
async function listVoices(): Promise<{ voice_id: string; name: string }[]> {
  const response = await fetch(`${ELEVENLABS_BASE_URL}/voices`, {
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to list voices: ${response.statusText}`);
  }

  const data = await response.json();
  return data.voices.map((v: { voice_id: string; name: string }) => ({
    voice_id: v.voice_id,
    name: v.name,
  }));
}

/**
 * Generate audio for a word using ElevenLabs TTS
 */
async function generateAudio(
  text: string,
  voiceId: string
): Promise<ArrayBuffer> {
  const response = await fetch(
    `${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: VOICE_SETTINGS,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`TTS API error: ${response.status} - ${errorText}`);
  }

  return response.arrayBuffer();
}

/**
 * Extract unique words from the baraye-words.json file
 */
function getUniqueWords(data: WordsData): Map<string, Word> {
  const uniqueWords = new Map<string, Word>();

  for (const line of data.lines) {
    for (const word of line.words) {
      // Use persian text as key to deduplicate
      if (!uniqueWords.has(word.persian)) {
        uniqueWords.set(word.persian, word);
      }
    }
  }

  return uniqueWords;
}

/**
 * Generate a mapping file for persian -> audio URL
 */
function generateMapping(
  uniqueWords: Map<string, Word>
): Record<string, string> {
  const mapping: Record<string, string> = {};

  for (const [persian] of uniqueWords) {
    const filename = encodeFilename(persian);
    mapping[persian] = `/audio/words/${filename}.mp3`;
  }

  return mapping;
}

async function main() {
  console.log("==============================================");
  console.log("ElevenLabs Word Audio Generation");
  console.log("==============================================\n");

  // Create output directory
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created output directory: ${OUTPUT_DIR}\n`);
  }

  // Load words data
  const wordsPath = join(process.cwd(), "scripts/baraye-words.json");
  const wordsData: WordsData = JSON.parse(readFileSync(wordsPath, "utf-8"));

  // Get unique words
  const uniqueWords = getUniqueWords(wordsData);
  console.log(`Total unique words: ${uniqueWords.size}\n`);

  // List voices and select one
  console.log("Fetching available voices...");
  const voices = await listVoices();
  console.log(`Found ${voices.length} voices`);

  // Use "Rachel" or the first available voice (Rachel is good for multilingual)
  // Or you can use a specific voice ID that works well for Persian
  const selectedVoice =
    voices.find((v) => v.name === "Rachel") ||
    voices.find((v) => v.name === "Adam") ||
    voices[0];

  if (!selectedVoice) {
    console.error("No voices available!");
    process.exit(1);
  }

  console.log(`Selected voice: ${selectedVoice.name} (${selectedVoice.voice_id})\n`);

  // Generate audio for each unique word
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  console.log("Generating audio files...\n");

  for (const [persian, word] of uniqueWords) {
    const filename = encodeFilename(persian);
    const outputPath = join(OUTPUT_DIR, `${filename}.mp3`);

    // Skip if file already exists
    if (existsSync(outputPath)) {
      console.log(`  [SKIP] ${persian} (${word.transliteration}) - already exists`);
      skipCount++;
      continue;
    }

    try {
      console.log(`  [GEN] ${persian} (${word.transliteration})...`);
      const audioBuffer = await generateAudio(persian, selectedVoice.voice_id);
      writeFileSync(outputPath, Buffer.from(audioBuffer));
      successCount++;

      // Rate limiting: wait 100ms between requests to avoid hitting API limits
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.log(`  [ERR] ${persian} - ${errorMsg}`);
      errors.push(`${persian}: ${errorMsg}`);
      errorCount++;
    }
  }

  // Generate mapping file
  const mapping = generateMapping(uniqueWords);
  const mappingPath = join(process.cwd(), "scripts/word-audio-mapping.json");
  writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));

  console.log("\n==============================================");
  console.log("Generation Complete!");
  console.log("==============================================");
  console.log(`  Generated: ${successCount}`);
  console.log(`  Skipped (existing): ${skipCount}`);
  console.log(`  Errors: ${errorCount}`);
  console.log(`  Output: ${OUTPUT_DIR}/`);
  console.log(`  Mapping: ${mappingPath}`);

  if (errors.length > 0) {
    console.log("\nErrors:");
    errors.forEach((e) => console.log(`  - ${e}`));
  }

  console.log("\n==============================================\n");
}

main().catch(console.error);
