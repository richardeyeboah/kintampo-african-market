/**
 * OneDrive on Windows locks files under `.next/` → EPERM during `next build` and
 * `vercel build`. Wipe `.next` before production builds when the repo is under
 * OneDrive (Vercel cloud builds are unaffected — they are not on OneDrive).
 */
const fs = require('fs')
const path = require('path')

function isOneDriveProjectRoot(cwd = process.cwd()) {
  return process.platform === 'win32' && cwd.replace(/\\/g, '/').includes('/OneDrive/')
}

function resolveNextDistDir(cwd = process.cwd()) {
  return path.join(cwd, '.next')
}

function cleanNextForBuild(cwd = process.cwd()) {
  if (!isOneDriveProjectRoot(cwd)) return

  const nextDir = resolveNextDistDir(cwd)
  if (!fs.existsSync(nextDir)) return

  try {
    fs.rmSync(nextDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 400 })
    console.log('[next-dist-dir] OneDrive: cleared .next before build')
  } catch (err) {
    console.error(
      '[next-dist-dir] OneDrive locked .next — pause OneDrive sync, delete the .next folder in this project, then rerun.'
    )
    throw err
  }
}

function ensureNextDistDir(cwd = process.cwd()) {
  const dir = resolveNextDistDir(cwd)
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

function cleanNextTypes(cwd = process.cwd()) {
  const typesDir = path.join(resolveNextDistDir(cwd), 'types')
  try {
    fs.rmSync(typesDir, { recursive: true, force: true })
  } catch {
    /* ignore */
  }
}

module.exports = {
  isOneDriveProjectRoot,
  resolveNextDistDir,
  cleanNextForBuild,
  ensureNextDistDir,
  cleanNextTypes,
}

if (require.main === module) {
  const mode = process.argv[2] ?? 'build'
  if (mode === 'build') {
    cleanNextForBuild()
  } else {
    ensureNextDistDir()
  }
}
