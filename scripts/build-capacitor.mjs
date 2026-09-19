import { spawnSync } from 'node:child_process'

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const result = spawnSync(npm, ['run', 'build'], {
  stdio: 'inherit',
  env: { ...process.env, CAPACITOR_BUILD: 'true' },
})

process.exit(result.status ?? 1)
