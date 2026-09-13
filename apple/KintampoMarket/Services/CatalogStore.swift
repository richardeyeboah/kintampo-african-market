import Foundation
import Observation

/// Shared catalog — one fetch, reused across Home + Shop. Avoids the slow double-load.
@Observable
@MainActor
final class CatalogStore {
    static let shared = CatalogStore()

    private(set) var products: [Product] = []
    private(set) var isLoading = false
    private(set) var errorMessage: String?
    private(set) var lastFetchedAt: Date?

    private let cacheTTL: TimeInterval = 120

    var isFresh: Bool {
        guard let lastFetchedAt else { return false }
        return Date().timeIntervalSince(lastFetchedAt) < cacheTTL
    }

    func featured(limit: Int = 12) -> [Product] {
        Array(products.prefix(limit))
    }

    func filtered(
        search: String = "",
        category: String? = nil,
        inStockOnly: Bool = false
    ) -> [Product] {
        var list = products
        if let category, !category.isEmpty {
            list = list.filter { $0.category == category }
        }
        if inStockOnly {
            list = list.filter(\.effectiveInStock)
        }
        let q = search.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if !q.isEmpty {
            list = list.filter {
                $0.name.lowercased().contains(q)
                    || ($0.brand?.lowercased().contains(q) ?? false)
                    || $0.category.lowercased().contains(q)
            }
        }
        return list
    }

    /// Warm cache at launch. Skips network if still fresh unless `force`.
    func loadIfNeeded(force: Bool = false) async {
        if !force, isFresh, !products.isEmpty { return }
        await reload()
    }

    func reload() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            // One wider fetch; filter locally for instant category/search.
            products = try await SupabaseService.shared.fetchProducts(limit: 200, listMode: true)
            lastFetchedAt = Date()
        } catch {
            errorMessage = error.localizedDescription
            if products.isEmpty {
                products = []
            }
        }
    }
}
