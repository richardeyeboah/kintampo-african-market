const ORIGIN = 'https://kintampoafricanmarket.com'
const html = await fetch(`${ORIGIN}/checkout`).then((r) => r.text())
const paths = [...new Set([...html.matchAll(/\/_next\/static\/[^"'\s]+\.js/g)].map((m) => m[0]))]
for (const path of paths) {
  const js = await fetch(ORIGIN + path).then((r) => r.text())
  const m = js.match(/pk_(live|test)_[A-Za-z0-9]+/)
  if (m) {
    console.log(m[0].startsWith('pk_live_') ? 'LIVE OK' : 'STILL TEST', m[0].slice(0, 20) + '…')
    process.exit(m[0].startsWith('pk_live_') ? 0 : 1)
  }
}
console.log('NOT FOUND')
process.exit(1)
