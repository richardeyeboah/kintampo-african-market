import Link from 'next/link'
import { PageHeader } from '@/components/store/PageHeader'
import { STORE, getSupportEmail, storePhonesPlain } from '@/lib/constants/store'

export const metadata = { title: 'Terms of Service' }

export default function TermsPage() {
  const supportEmail = getSupportEmail()
  const year = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-cream">
      <PageHeader eyebrow="Legal" title="Terms of service" />
      <div className="store-container max-w-3xl py-10 sm:py-12">
        <p className="text-sm text-earth-400">Last updated: June 2025</p>

        <div className="mt-8 space-y-8 text-base leading-relaxed text-earth-700">

          <section>
            <h2 className="mb-3 text-lg font-semibold text-earth-900">1. Who we are</h2>
            <p>
              {STORE.name} (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is an African and Caribbean grocery store located at{' '}
              {STORE.address}, Columbus, Ohio 43229. We operate the website{' '}
              this website and ship products across the United States.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-earth-900">2. Acceptance of terms</h2>
            <p>
              By placing an order or creating an account on our website, you confirm that you are at
              least 18 years old and agree to these Terms of Service and our Privacy Policy. If you
              do not agree, please do not use our website.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-earth-900">3. Products and pricing</h2>
            <p>
              We strive to keep product listings, prices, and availability accurate. However, errors
              may occur. We reserve the right to correct pricing errors and to limit quantities on
              any order. If a product you ordered is unavailable, we will contact you promptly and
              offer a full refund or substitute.
            </p>
            <p className="mt-3">
              Prices are in US dollars and are subject to change without notice. Sales tax is applied
              to applicable non-food items in accordance with Ohio state tax law.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-earth-900">4. Orders and payment</h2>
            <p>
              Placing an order constitutes an offer to purchase. We reserve the right to accept or
              decline any order. Orders are confirmed by email once payment is processed. Payment is
              processed securely through Stripe — we do not store your full card details on our
              servers.
            </p>
            <p className="mt-3">
              We reserve the right to cancel orders in cases of suspected fraud, pricing errors,
              or supply issues, and will issue a full refund in such cases.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-earth-900">5. Shipping and delivery</h2>
            <p>
              We ship to all US states via USPS and partner carriers. Shipping costs and estimated
              delivery times are shown at checkout. Delivery times are estimates only and are not
              guaranteed. We are not responsible for delays caused by carriers or customs.
            </p>
            <p className="mt-3">
              In-store pickup is available at our Columbus, OH location during business hours.
              Risk of loss and title for products passes to you upon delivery to the carrier.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-earth-900">6. Returns and refunds</h2>
            <p>
              We want you to be happy with your purchase. If you receive a damaged, incorrect, or
              defective item, contact us within 7 days of delivery at{' '}
              <a href={`mailto:${supportEmail}`} className="font-medium text-brand-700">
                {supportEmail}
              </a>{' '}
              and we will arrange a replacement or refund.
            </p>
            <p className="mt-3">
              Due to the perishable nature of food products, we are unable to accept returns on
              food items unless they are damaged or incorrect. Non-food items in original,
              unopened condition may be returned within 14 days.
            </p>
            <p className="mt-3">
              Refunds are processed to the original payment method within 5–10 business days.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-earth-900">7. Your account</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials.
              You agree to notify us immediately of any unauthorised use of your account. We are not
              liable for any loss resulting from someone else using your account without your
              permission.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-earth-900">8. Intellectual property</h2>
            <p>
              All content on this website — including images, text, logos, and product descriptions
              — is the property of {STORE.name} or its content suppliers and is protected by
              copyright. You may not reproduce or redistribute any content without our written
              permission.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-earth-900">9. Limitation of liability</h2>
            <p>
              To the fullest extent permitted by law, {STORE.name} is not liable for indirect,
              incidental, special, or consequential damages arising from your use of our website or
              products. Our total liability for any claim shall not exceed the amount you paid for
              the specific order giving rise to the claim.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-earth-900">10. Governing law</h2>
            <p>
              These terms are governed by the laws of the State of Ohio, USA. Any disputes shall
              be resolved in the courts of Franklin County, Ohio.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-earth-900">11. Contact us</h2>
            <p>
              Questions about these terms? Contact us at{' '}
              <a href={`mailto:${supportEmail}`} className="font-medium text-brand-700">
                {supportEmail}
              </a>{' '}
              or call us at {storePhonesPlain()}.
            </p>
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
