import os from 'node:os'

const port = process.env.PORT || '3000'
const nets = os.networkInterfaces()
const ips = []

for (const name of Object.keys(nets)) {
  for (const net of nets[name] ?? []) {
    const v4 = net.family === 'IPv4' || net.family === 4
    if (v4 && !net.internal) {
      ips.push(net.address)
    }
  }
}

console.log('')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('  PHONE (same WiFi): use your PC address, NOT localhost')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
if (ips.length === 0) {
  console.log('  (Could not detect WiFi IP — run `ipconfig` and use IPv4 under Wi‑Fi.)')
} else {
  for (const ip of ips) {
    console.log(`  →  http://${ip}:${port}`)
  }
}
console.log('')
console.log('  If the page loads but styles/JS look broken:')
console.log('  1. Copy the IP you used (e.g. 192.168.1.105)')
console.log('  2. In the project .env.local add:')
console.log('     DEV_PHONE_HOSTS=' + (ips[0] ?? '192.168.x.x'))
console.log('  3. Restart this dev server (Ctrl+C, then npm run dev:phone)')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')
