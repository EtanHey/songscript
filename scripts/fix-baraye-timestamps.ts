/**
 * Timestamp fixes for the Baraye song
 *
 * The main issue was Line 19 being only 0.53 seconds (too short!).
 * This caused the "bunched phrases" bug.
 *
 * To apply these fixes to the live database, use the Convex dashboard:
 * 1. Go to https://dashboard.convex.dev
 * 2. Select your project
 * 3. Go to "Functions" -> "lyrics" -> "updateTimestamps"
 * 4. Run with the songId and updates below
 *
 * Or re-seed the database: npx convex run seed:seedBaraye
 */

// Song ID for Baraye (get from dashboard or use api.songs.list)
// const BARAYE_SONG_ID = "your_song_id_here";

// All timestamp fixes (lines 18-31 were adjusted)
export const TIMESTAMP_FIXES = [
  { lineNumber: 18, startTime: 77.62, endTime: 84.0 },
  { lineNumber: 19, startTime: 84.2, endTime: 87.5 },     // Was only 0.53s!
  { lineNumber: 20, startTime: 87.7, endTime: 91.0 },
  { lineNumber: 21, startTime: 91.0, endTime: 94.5 },
  { lineNumber: 22, startTime: 94.5, endTime: 98.2 },
  { lineNumber: 23, startTime: 98.2, endTime: 102.0 },
  { lineNumber: 24, startTime: 102.0, endTime: 105.7 },
  { lineNumber: 25, startTime: 105.7, endTime: 109.4 },
  { lineNumber: 26, startTime: 109.4, endTime: 113.1 },
  { lineNumber: 27, startTime: 113.1, endTime: 123.0 },
  { lineNumber: 28, startTime: 123.0, endTime: 130.5 },
  { lineNumber: 29, startTime: 130.5, endTime: 137.8 },
  { lineNumber: 30, startTime: 137.8, endTime: 145.0 },
  { lineNumber: 31, startTime: 145.0, endTime: 151.46 },
];

// Example mutation call for Convex dashboard:
/*
{
  "songId": "YOUR_BARAYE_SONG_ID",
  "updates": [
    { "lineNumber": 18, "startTime": 77.62, "endTime": 84.0 },
    { "lineNumber": 19, "startTime": 84.2, "endTime": 87.5 },
    { "lineNumber": 20, "startTime": 87.7, "endTime": 91.0 },
    { "lineNumber": 21, "startTime": 91.0, "endTime": 94.5 },
    { "lineNumber": 22, "startTime": 94.5, "endTime": 98.2 },
    { "lineNumber": 23, "startTime": 98.2, "endTime": 102.0 },
    { "lineNumber": 24, "startTime": 102.0, "endTime": 105.7 },
    { "lineNumber": 25, "startTime": 105.7, "endTime": 109.4 },
    { "lineNumber": 26, "startTime": 109.4, "endTime": 113.1 },
    { "lineNumber": 27, "startTime": 113.1, "endTime": 123.0 },
    { "lineNumber": 28, "startTime": 123.0, "endTime": 130.5 },
    { "lineNumber": 29, "startTime": 130.5, "endTime": 137.8 },
    { "lineNumber": 30, "startTime": 137.8, "endTime": 145.0 },
    { "lineNumber": 31, "startTime": 145.0, "endTime": 151.46 }
  ]
}
*/
