import Foundation

enum AppConfig {
    static var fixtureURL: URL? {
        #if DEBUG
        guard ProcessInfo.processInfo.arguments.contains("--fixture-testing"),
              let raw = ProcessInfo.processInfo.environment["KINTAMPO_FIXTURE_URL"],
              let url = URL(string: raw), ["127.0.0.1", "localhost"].contains(url.host ?? "") else { return nil }
        return url
        #else
        return nil
        #endif
    }
    private static func info(_ key: String) -> String {
        (Bundle.main.infoDictionary?[key] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    }

    /// Values injected via Config.xcconfig → Info.plist.
    static var supabaseURL: URL {
        if let fixtureURL { return fixtureURL }
        let raw = info("SUPABASE_URL")
        guard let url = URL(string: raw), !raw.contains("YOUR_PROJECT"), !raw.isEmpty else {
            return URL(string: "https://placeholder.supabase.co")!
        }
        return url
    }

    static var supabaseAnonKey: String { fixtureURL == nil ? info("SUPABASE_ANON_KEY") : "fixture-only" }

    static var siteURL: URL {
        if let fixtureURL { return fixtureURL }
        let raw = info("SITE_URL")
        guard let url = URL(string: raw), !raw.isEmpty else {
            return URL(string: "https://kintampoafricanmarket.com")!
        }
        return url
    }

    static var localSiteURL: URL? {
        let raw = info("LOCAL_SITE_URL")
        guard !raw.isEmpty else { return nil }
        return URL(string: raw)
    }

    static var stripePublishableKey: String { info("STRIPE_PUBLISHABLE_KEY") }
    /// Empty until Apple Pay merchant ID is registered in Apple Developer + Stripe.
    static var applePayMerchantId: String { info("APPLE_PAY_MERCHANT_ID") }
    static var supportEmail: String { info("SUPPORT_EMAIL") }
    static var merchantOrderEmail: String { info("MERCHANT_ORDER_EMAIL") }
    static var storePhone: String { info("STORE_PHONE") }
    static var whatsAppNumber: String {
        let w = info("WHATSAPP_NUMBER")
        return w.isEmpty ? storePhone : w
    }
    static var shipFromName: String { info("SHIP_FROM_NAME") }
    static var shipFromCity: String { info("SHIP_FROM_CITY") }
    static var shipFromState: String { info("SHIP_FROM_STATE") }
    static var shipFromCountry: String { info("SHIP_FROM_COUNTRY") }

    static var isConfigured: Bool {
        !supabaseAnonKey.isEmpty && !supabaseAnonKey.contains("your_anon")
    }

    static var webShopURL: URL { siteURL.appending(path: "shop") }
    static var webCheckoutURL: URL { siteURL.appending(path: "checkout") }
}

enum AppError: LocalizedError {
    case notConfigured
    case network(String)
    case decode
    case unauthorized

    var errorDescription: String? {
        switch self {
        case .notConfigured:
            return "Add Supabase keys in apple/Config.xcconfig (copy from Config.example.xcconfig)."
        case .network(let msg):
            return msg
        case .decode:
            return "Could not read server response."
        case .unauthorized:
            return "Sign in required."
        }
    }
}
