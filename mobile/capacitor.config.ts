import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Native shell for Kintampo African Market.
 * Loads the live website — does not rebuild or redeploy the Next.js app.
 * Change `server.url` to a Vercel preview URL for safe testing.
 */
const LIVE_SITE = process.env.CAPACITOR_SERVER_URL?.trim() || 'https://kintampoafricanmarket.com'

const config: CapacitorConfig = {
  appId: 'com.kintampoafricanmarket.app',
  appName: 'Kintampo',
  webDir: 'www',
  server: {
    url: LIVE_SITE,
    cleartext: false,
    // Keep checkout / auth redirects inside the WebView
    allowNavigation: [
      'kintampoafricanmarket.com',
      '*.kintampoafricanmarket.com',
      '*.stripe.com',
      '*.supabase.co',
      'js.stripe.com',
      'hooks.stripe.com',
    ],
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#fafafa',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#ce1126',
    },
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#fafafa',
  },
  ios: {
    backgroundColor: '#fafafa',
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
  },
}

export default config
