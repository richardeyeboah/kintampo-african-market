import { writeFileSync } from 'node:fs'
const res = await fetch('https://kintampoafricanmarket.com/', {
  headers: { 'cache-control': 'no-cache', pragma: 'no-cache' },
})
const html = await res.text()
writeFileSync('tmp/home-head-check.html', html.slice(0, 4000))
const m = html.match(/google-site-verification[^>]*>/i)
console.log('status', res.status)
console.log('tag', m ? m[0] : 'MISSING')
console.log('www redirect check...')
const www = await fetch('https://www.kintampoafricanmarket.com/', { redirect: 'manual' })
console.log('www status', www.status, 'location', www.headers.get('location'))
