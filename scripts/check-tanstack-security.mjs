import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// GHSA-qx66-fv34-fjm8 / CVE-2026-102989: check every locked copy,
// including transitive copies that a package.json-only check would miss.
const minimums = {
  '@tanstack/react-start': [1, 168, 60],
  '@tanstack/start-server-core': [1, 169, 39],
}
// Compromised releases from GHSA-g7cv-rxg3-hmpx (including both release waves).
const malware = JSON.parse(readFileSync(new URL('./tanstack-malware-versions.json', import.meta.url), 'utf8'))
const lock = execFileSync('bun', ['bun.lockb'], {
  cwd: fileURLToPath(new URL('../', import.meta.url)),
  encoding: 'utf8',
  maxBuffer: 4 * 1024 * 1024,
})
const entries = [...lock.matchAll(
  /^"(@tanstack\/[^"@]+)@.*:\r?\n\s+version "([^"]+)"/gm,
)]
const failures = []

for (const [name, minimum] of Object.entries(minimums)) {
  const versions = entries.filter((entry) => entry[1] === name).map((entry) => entry[2])
  if (versions.length === 0) failures.push(`${name}: missing from bun.lockb`)
  for (const version of versions) {
    const parts = /^\d+\.\d+\.\d+$/.test(version) ? version.split('.').map(Number) : []
    const firstDifference = parts.findIndex((part, index) => part !== minimum[index])
    const patched = parts.length === 3 && (
      firstDifference === -1 || parts[firstDifference] > minimum[firstDifference]
    )
    if (!patched) failures.push(`${name}@${version}: requires >=${minimum.join('.')}`)
  }
  console.log(`${name}: ${versions.join(', ') || 'MISSING'}`)
}

for (const [, name, version] of entries) {
  if (malware[name]?.includes(version)) failures.push(`${name}@${version}: GHSA-g7cv-rxg3-hmpx malware`)
}
assert.equal(failures.length, 0, `TanStack lockfile guard failed:\n${failures.join('\n')}`)
console.log(`TanStack lockfile guard: PASS (XSS floors + malware check of ${entries.length} locked entries)`)
