import Foundation

final class MockHTTP: URLProtocol, @unchecked Sendable {
    static let lock = NSLock()
    static var handler: ((URLRequest) throws -> (Int, String))!
    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func startLoading() {
        do {
            Self.lock.lock()
            let result: (Int, String)
            do { result = try Self.handler(request); Self.lock.unlock() }
            catch { Self.lock.unlock(); throw error }
            let response = HTTPURLResponse(url: request.url!, statusCode: result.0, httpVersion: nil,
                                           headerFields: ["Content-Type": "application/json"])!
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: Data(result.1.utf8))
            client?.urlProtocolDidFinishLoading(self)
        } catch { client?.urlProtocol(self, didFailWithError: error) }
    }
    override func stopLoading() {}
}

@main struct MobileRegression {
    static var checks = 0
    static func check(_ condition: Bool, _ message: String) {
        precondition(condition, message)
        checks += 1
    }
    static func decode<T: Decodable>(_ value: String, as type: T.Type) throws -> T {
        try JSONDecoder().decode(type, from: Data(value.utf8))
    }
    static func product(_ id: String, stock: Int? = nil) throws -> Product {
        try decode("""
        {"id":"\(id)","name":"Yam","price":5,"category":"Produce","in_stock":true,"created_at":"2026-01-01","stock_quantity":\(stock.map(String.init) ?? "null")}
        """, as: Product.self)
    }
    @MainActor static func main() async throws {
        let suite = "kintampo-tests-\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suite)!
        defer { defaults.removePersistentDomain(forName: suite) }
        let cart = CartStore(defaults: defaults)
        let limited = try product("limited", stock: 2)
        cart.add(limited, quantity: 50)
        check(cart.itemCount == 2, "Stock must cap additions")
        cart.add(limited)
        check(cart.itemCount == 2, "Repeated additions must respect stock")
        cart.setQuantity(productID: limited.id, quantity: 99)
        check(cart.itemCount == 2, "Stepper must respect stock")
        cart.add(try product("empty", stock: 0))
        check(cart.items.count == 1, "Out of stock must not enter cart")
        cart.add(try product("unlimited"), quantity: Int.max)
        check(cart.items.last?.quantity == 99, "Global limit must apply without overflow")
        cart.add(try product("third"))
        cart.remove(at: IndexSet([0, 2]))
        check(cart.items.map(\.product.id) == ["unlimited"], "Batch deletion must use original indexes")
        check(CartStore(defaults: defaults).items == cart.items, "Cart must persist")

        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [MockHTTP.self]
        let session = URLSession(configuration: config)
        let api = APIClient(session: session, baseURL: URL(string: "https://fixture.invalid")!)
        MockHTTP.handler = { _ in (200, """
        {"order":{"id":"order-1","order_number":1042,"created_at":"2026-01-01","status":"ordered"},"items":[],"logs":[]}
        """) }
        let order = try await api.trackOrder(id: "LQ-1042", email: "fixture@example.com")
        check(order.id == "order-1", "Tracking must decode nested order")
        for json in ["{\"status\":\"processing\"}", "{\"status\":\"complete\"}", "{\"status\":\"unpaid\",\"paymentStatus\":\"processing\"}"] {
            let status = try decode(json, as: CheckoutStatusResult.self)
            check(status.confirmationMessage == nil, "Unconfirmed status must never signal success")
            check(!status.canStartNewPayment, "Unresolved payment must not permit another charge")
        }
        let completed = try decode("{\"status\":\"complete\",\"orderId\":\"order-1\"}", as: CheckoutStatusResult.self)
        check(completed.confirmationMessage != nil, "Confirmed order must complete")
        let retry = try decode("{\"status\":\"unpaid\",\"paymentStatus\":\"requires_payment_method\"}", as: CheckoutStatusResult.self)
        check(retry.canStartNewPayment, "Declined payment may be retried")

        var refreshes = 0
        MockHTTP.handler = { request in
            if request.url!.query!.contains("refresh_token") {
                refreshes += 1
                return (200, "{\"access_token\":\"renewed\",\"refresh_token\":\"rotated\",\"expires_in\":3600,\"user\":{\"id\":\"user-1\",\"email\":\"fixture@example.com\"}}")
            }
            return (200, "{\"access_token\":\"expired\",\"refresh_token\":\"refresh\",\"expires_in\":0,\"user\":{\"id\":\"user-1\"}}")
        }
        let service = SupabaseService(session: session, baseURL: URL(string: "https://fixture.invalid")!, anonKey: "test", persistSession: false)
        _ = try await service.signInWithSession(email: "fixture@example.com", password: "fixture-only")
        async let first = service.validSession()
        async let second = service.validSession()
        let (a, b) = try await (first, second)
        check(a?.accessToken == "renewed" && b?.accessToken == "renewed", "Expired tokens must refresh")
        check(refreshes == 1, "Concurrent requests must share refresh")
        check(a?.refreshToken == "rotated", "Rotated refresh token must replace old token")
        await service.signOut()
        let signedOut = try await service.validSession()
        check(signedOut == nil, "Sign out must clear session")
        _ = try await service.signInWithSession(email: "fixture@example.com", password: "fixture-only")
        MockHTTP.handler = { _ in (400, "{\"error\":\"invalid_grant\"}") }
        do { _ = try await service.validSession(); preconditionFailure("Revoked refresh must fail") }
        catch AppError.unauthorized { checks += 1 }
        let revoked = try await service.validSession()
        check(revoked == nil, "Revoked session must not remain signed in")
        print("PASS: \(checks) mobile regression checks (mock network; no live payments)")
    }
}
