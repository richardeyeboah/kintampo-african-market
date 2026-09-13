import Link from 'next/link'
import { PageHeader } from '@/components/store/PageHeader'
import { STORE, getSupportEmail, storePhonesPlain } from '@/lib/constants/store'

export const metadata = { title: 'Privacy Policy' }

export default function PrivacyPage() {
  const supportEmail = getSupportEmail()
  const year = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-cream">
      <PageHeader eyebrow="Legal" title="Privacy policy" />
      <div className="store-container max-w-3xl py-10 sm:py-12">
        <p className="text-sm text-earth-400">Last updated: June 2025</p>

        <div className="mt-8 space-y-8 text-base leading-relaxed text-earth-700">

          <section>
            <h2 className="mb-3 text-lg font-semibold text-earth-900">1. Who we are</h2>
            <p>
              {STORE.name} operates this website. We are located at {STORE.address}.
              This Privacy Policy explains how we collect, use, and protect your personal information
              when you use our website or place an order.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-earth-900">2. Information we collect</h2>
            <p>We collect information you provide directly to us, including:</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-6">
              <li><strong>Account information:</strong> name, email address, phone number, and password when you create an account.</li>
              <li><strong>Order information:</strong> shipping address, billing details, and the items you purchase.</li>
              <li><strong>Communications:</strong> messages you send us via email or the feedback form.</li>
            </ul>
            <p className="mt-3">
              We also automatically collect certain technical information when you visit our site,
              including your IP address, browser type, pages viewed, and referring URL. We use
              Vercel Analytics for aggregated, anonymous traffic analysis — no personal data is
              stored in our analytics.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-earth-900">3. How we use your information</h2>
            <p>We use the information we collect to:</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-6">
              <li>Process and fulfil your orders, and send order confirmation and shipping updates.</li>
              <li>Communicate with you about your account or orders.</li>
              <li>Send you promotional emails if you have opted in (you can unsubscribe at any time).</li>
              <li>Improve our website, products, and customer service.</li>
              <li>Prevent fraud and ensure the security of our platform.</li>
              <li>Comply with legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-earth-900">4. How we share your information</h2>
            <p>
              We do not sell, rent, or trade your personal information to third parties. We may
              share your information with trusted service providers who assist us in running our
              business, including:
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-6">
              <li><strong>Stripe:</strong> payment processing. Your card details go directly to Stripe — we never see or store full card numbers.</li>
              <li><strong>Supabase:</strong> secure database and authentication hosting.</li>
              <li><strong>Vercel:</strong> website hosting and analytics.</li>
              <li><strong>Shippo / USPS:</strong> shipping label generation and package delivery.</li>
              <li><strong>Email providers:</strong> order confirmation and notification emails.</li>
            </ul>
            <p className="mt-3">
              All service providers are contractually required to protect your data and use it only
              to provide services to us. We may also disclose information when required by law or
              to protect the rights and safety of our business and customers.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-earth-900">5. Cookies</h2>
            <p>
              We use essential cookies to keep you logged in and remember your cart. We do not use
              advertising or tracking cookies. Our analytics are privacy-friendly and aggregated —
              no individual tracking.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-earth-900">6. Data retention</h2>
            <p>
              We retain your account information and order history for as long as your account is
              active or as needed to provide services and comply with legal obligations. You can
              request deletion of your account and personal data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-earth-900">7. Your rights</h2>
            <p>You have the right to:</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-6">
              <li>Access the personal information we hold about you.</li>
              <li>Request correction of inaccurate information.</li>
              <li>Request deletion of your personal data.</li>
              <li>Opt out of marketing emails at any time using the unsubscribe link.</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at{' '}
              <a href={`mailto:${supportEmail}`} className="font-medium text-brand-700">
                {supportEmail}
              </a>.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-earth-900">8. Children&apos;s privacy</h2>
            <p>
              Our website is not directed at children under 13. We do not knowingly collect
              personal information from children. If you believe we have inadvertently collected
              information from a child, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-earth-900">9. Security</h2>
            <p>
              We take reasonable technical and organisational measures to protect your personal
              information against unauthorised access, loss, or misuse. All data is transmitted
              over encrypted HTTPS connections. However, no internet transmission is 100% secure,
              and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-earth-900">10. Changes to this policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this
              page with an updated date. Continued use of our website after changes constitutes
              acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-earth-900">11. Contact us</h2>
            <p>
              Questions or concerns about your privacy? Contact us at:
            </p>
            <address className="mt-3 not-italic text-earth-700">
              {STORE.name}<br />
              {STORE.address}<br />
              Phone: {storePhonesPlain()}
<br />
              Email:{' '}
              <a href={`mailto:${supportEmail}`} className="font-medium text-brand-700">
                {supportEmail}
              </a>
            </address>
          </section>

          <p className="border-t border-earth-200 pt-6 text-sm text-earth-400">
            © {year} {STORE.name}. All rights reserved.
          </p>
        </div>

        <p className="mt-10">
          <Link href="/shop" className="text-sm font-semibold text-brand-700 no-underline">
            ← Continue shopping
          </Link>
        </p>
      </div>
    </div>
  )
}
