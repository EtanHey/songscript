/**
 * Format seconds to MM:SS or H:MM:SS format
 */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00'
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * Parse MM:SS or H:MM:SS format to seconds
 */
export function parseTime(timeString: string): number {
  const parts = timeString.split(':').map(Number)

  if (parts.some((part) => !Number.isFinite(part) || part < 0)) {
    return 0
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts
    return minutes * 60 + seconds
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts
    return hours * 3600 + minutes * 60 + seconds
  }

  return 0
}

/**
 * Calculate duration between two timestamps in seconds
 */
export function calculateDuration(startTime: number, endTime: number): number {
  if (
    !Number.isFinite(startTime) ||
    !Number.isFinite(endTime) ||
    startTime < 0 ||
    endTime < 0
  ) {
    return 0
  }
  return Math.max(0, endTime - startTime)
}
