#!/usr/bin/env bun
/**
 * Fetch Forvo audio URLs for Persian words
 *
 * This script fetches pronunciation audio URLs from Forvo's public pages
 * and updates the words table with forvoAudioUrl.
 *
 * Usage: bun run scripts/fetch-forvo-audio.ts
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

// Types
interface Word {
  persian: string;
  transliteration: string;
}

interface WordLine {
  lineNumber: number;
  words: Word[];
}

interface WordsData {
  songSlug: string;
  lines: WordLine[];
}

interface ForvoResult {
  persian: string;
  audioUrl: string | null;
  error?: string;
}

/**
 * Try to find Forvo audio URL for a Persian word
 * Uses Forvo's public page structure
 */
async function fetchForvoAudio(persian: string): Promise<ForvoResult> {
  const encodedWord = encodeURIComponent(persian);
  const url = `https://forvo.com/word/${encodedWord}/#fa`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      }
    });

    if (!response.ok) {
      return { persian, audioUrl: null, error: `HTTP ${response.status}` };
    }

    const html = await response.text();

    // Look for audio play function calls in the HTML
    // Forvo uses Play() function with base64 encoded audio paths
    const playMatch = html.match(/Play\([\d]+,'([^']+)','([^']+)',/);

    if (playMatch) {
      // The second capture group is usually the mp3 path encoded in base64
      const encodedPath = playMatch[2];
      try {
        const decodedPath = Buffer.from(encodedPath, 'base64').toString('utf-8');
        const audioUrl = `https://audio00.forvo.com/audios/mp3/${decodedPath}`;
        return { persian, audioUrl };
      } catch {
        return { persian, audioUrl: null, error: 'Failed to decode audio path' };
      }
    }

    // Alternative: look for data-mp3 attributes
    const dataMp3Match = html.match(/data-mp3="([^"]+)"/);
    if (dataMp3Match) {
      return { persian, audioUrl: dataMp3Match[1] };
    }

    return { persian, audioUrl: null, error: 'No audio found on page' };
  } catch (error) {
    return {
      persian,
      audioUrl: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Extract unique words from baraye-words.json
 */
function getUniqueWords(data: WordsData): Map<string, Word> {
  const uniqueWords = new Map<string, Word>();

  for (const line of data.lines) {
    for (const word of line.words) {
      if (!uniqueWords.has(word.persian)) {
        uniqueWords.set(word.persian, word);
      }
    }
  }

  return uniqueWords;
}

async function main() {
  console.log("==============================================");
  console.log("Forvo Audio URL Fetcher");
  console.log("==============================================\n");

  // Load words data
  const wordsPath = join(process.cwd(), "scripts/baraye-words.json");
  if (!existsSync(wordsPath)) {
    console.error(`Error: ${wordsPath} not found`);
    process.exit(1);
  }

  const wordsData: WordsData = JSON.parse(readFileSync(wordsPath, "utf-8"));
  const uniqueWords = getUniqueWords(wordsData);

  console.log(`Total unique words: ${uniqueWords.size}\n`);
  console.log("Fetching Forvo audio URLs...\n");

  const results: ForvoResult[] = [];
  let successCount = 0;
  let failCount = 0;

  for (const [persian, word] of uniqueWords) {
    console.log(`  Checking: ${persian} (${word.transliteration})...`);

    const result = await fetchForvoAudio(persian);
    results.push(result);

    if (result.audioUrl) {
      console.log(`    ✓ Found: ${result.audioUrl.substring(0, 60)}...`);
      successCount++;
    } else {
      console.log(`    ✗ Not found: ${result.error}`);
      failCount++;
    }

    // Rate limiting - be nice to Forvo
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Save results
  const outputPath = join(process.cwd(), "scripts/forvo-audio-results.json");
  writeFileSync(outputPath, JSON.stringify(results, null, 2));

  // Generate Convex mutation commands for successful results
  const successfulResults = results.filter(r => r.audioUrl);

  console.log("\n==============================================");
  console.log("Results");
  console.log("==============================================");
  console.log(`  Found: ${successCount}`);
  console.log(`  Not found: ${failCount}`);
  console.log(`  Output: ${outputPath}`);

  if (successfulResults.length > 0) {
    console.log("\n\nTo update the database, run these mutations:");
    console.log("(Or create a mutation that accepts array of updates)\n");

    for (const result of successfulResults.slice(0, 5)) {
      console.log(`  Persian: ${result.persian}`);
      console.log(`  URL: ${result.audioUrl}\n`);
    }

    if (successfulResults.length > 5) {
      console.log(`  ... and ${successfulResults.length - 5} more in ${outputPath}`);
    }
  }
}

main().catch(console.error);
