import Foundation

struct SavedAddress: Identifiable, Codable, Hashable, Sendable {
    let id: String
    let userId: String?
    var label: String?
    var fullName: String
    var phone: String?
    var line1: String
    var line2: String?
    var city: String
    var state: String
    var country: String
    var postalCode: String
    var isDefault: Bool

    enum CodingKeys: String, CodingKey {
        case id, label, phone, city, state, country
        case userId = "user_id"
        case fullName = "full_name"
        case line1, line2
        case postalCode = "postal_code"
        case isDefault = "is_default"
    }

    var oneLine: String {
        [line1, city, state, postalCode].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: ", ")
    }
}

struct ProductBundle: Identifiable, Codable, Hashable, Sendable {
    let id: String
    let slug: String
    let name: String
    let description: String?
    let imageURL: String?
    let discountPercent: Double
    let sortOrder: Int?

    enum CodingKeys: String, CodingKey {
        case id, slug, name, description
        case imageURL = "image_url"
        case discountPercent = "discount_percent"
        case sortOrder = "sort_order"
    }

    var image: URL? {
        guard let imageURL else { return nil }
        return URL(string: imageURL)
    }
}

struct BundleItemRow: Codable, Sendable {
    let productId: String
    let quantity: Int

    enum CodingKeys: String, CodingKey {
        case productId = "product_id"
        case quantity
    }
}

struct WishlistRow: Codable, Sendable {
    let productId: String

    enum CodingKeys: String, CodingKey {
        case productId = "product_id"
    }
}

struct AuthSession: Codable, Sendable {
    let accessToken: String
    let refreshToken: String
    let expiresAt: Date
    let userId: String
    let email: String

    var needsRefresh: Bool { expiresAt.timeIntervalSinceNow < 60 }
}

struct PaymentIntentResult: Decodable, Sendable {
    let clientSecret: String
    let paymentIntentId: String?
    let publishableKey: String?
    let subtotal: Double
    let shippingFee: Double
    let taxAmount: Double
    let total: Double
    var intentID: String { paymentIntentId ?? clientSecret.components(separatedBy: "_secret_")[0] }
}

struct CheckoutStatusResult: Decodable, Sendable {
    let status: String
    let orderId: String?
    let orderNumber: Int?
    let orderStatus: String?
    let totalAmount: Double?
    let paymentStatus: String?

    var confirmationMessage: String? {
        guard status == "complete", let orderId, !orderId.isEmpty else { return nil }
        let label = orderNumber.map { "LQ-\($0)" } ?? orderId
        return "Order \(label) confirmed."
    }

    var canStartNewPayment: Bool {
        status == "unpaid" && ["requires_payment_method", "canceled"].contains(paymentStatus ?? "")
    }
}

enum ShippingMethodOption: String, CaseIterable, Identifiable {
    case pickup
    case standard
    case express
    case local_delivery

    var id: String { rawValue }

    var label: String {
        switch self {
        case .pickup: return "Store pickup"
        case .standard: return "Standard shipping"
        case .express: return "Express shipping"
        case .local_delivery: return "Local delivery"
        }
    }

    var hint: String {
        switch self {
        case .pickup: return "Free · Columbus store"
        case .standard: return "USPS Ground"
        case .express: return "Faster shipping"
        case .local_delivery: return "$5 · nearby Columbus"
        }
    }
}

enum SubstitutionOption: String, CaseIterable, Identifiable {
    case refund, call, substitute
    var id: String { rawValue }
    var label: String {
        switch self {
        case .refund: return "Refund missing items"
        case .call: return "Call me first"
        case .substitute: return "Substitute similar"
        }
    }
}

enum PickupSlotOption: String, CaseIterable, Identifiable {
    case today_asap, today_afternoon, tomorrow_morning, tomorrow_afternoon
    var id: String { rawValue }
    var label: String {
        switch self {
        case .today_asap: return "Today — ASAP"
        case .today_afternoon: return "Today — after 3pm"
        case .tomorrow_morning: return "Tomorrow — morning"
        case .tomorrow_afternoon: return "Tomorrow — afternoon"
        }
    }
}
