// One-off check: verifies Gmail SMTP login + sends a test email and a test SMS
// via the carrier gateway, exactly like the live site does on a new order.
// Usage: node scripts/test-order-alerts.mjs <gmail-user> <app-password> <sms-gateway>
import nodemailer from 'nodemailer'

const [user, pass, smsGateway] = process.argv.slice(2)
if (!user || !pass) {
  console.error('Usage: node scripts/test-order-alerts.mjs <gmail-user> <app-password> [sms-gateway]')
  process.exit(1)
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user, pass: pass.replace(/\s+/g, '') },
})

console.log('1) Verifying Gmail SMTP login...')
try {
  await transporter.verify()
  console.log('   OK — Gmail accepted the app password.')
} catch (e) {
  console.error('   FAILED — Gmail rejected login:', e.message)
  process.exit(1)
}

console.log('2) Sending test merchant email to', user, '...')
try {
  await transporter.sendMail({
    from: `Kintampo African Market <${user}>`,
    to: user,
    subject: 'Test: order alerts are working',
    text: 'This is a test of the new-order email alert. If you see this, email alerts work.',
  })
  console.log('   OK — email sent. Check the inbox.')
} catch (e) {
  console.error('   FAILED:', e.message)
}

if (smsGateway) {
  console.log('3) Sending test SMS via', smsGateway, '...')
  try {
    await transporter.sendMail({
      from: `Kintampo African Market <${user}>`,
      to: smsGateway,
      subject: '',
      text: 'Test order alert — if you got this text, SMS alerts work.',
    })
    console.log('   OK — sent to carrier gateway. Text should arrive within ~1 min.')
  } catch (e) {
    console.error('   FAILED:', e.message)
  }
}
console.log('Done.')
