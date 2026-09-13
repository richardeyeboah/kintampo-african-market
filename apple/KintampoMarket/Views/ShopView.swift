import SwiftUI

struct ShopView: View {
    var initialCategory: String? = nil

    @Bindable private var catalog = CatalogStore.shared
    @State private var searchText = ""
    @State private var selectedCategory: String?
    @State private var inStockOnly = false

    private var visible: [Product] {
        catalog.filtered(search: searchText, category: selectedCategory, inStockOnly: inStockOnly)
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundStyle(.secondary)
                TextField("Search products", text: $searchText)
                    .textFieldStyle(.plain)
                    .submitLabel(.search)
            }
            .padding(10)
            .background(.white)
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .padding()

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    CategoryChip(title: "All", selected: selectedCategory == nil) {
                        selectedCategory = nil
                    }
                    ForEach(StoreConfig.productCategories, id: \.self) { cat in
                        CategoryChip(title: cat, selected: selectedCategory == cat) {
                            selectedCategory = cat
                        }
                    }
                }
                .padding(.horizontal)
            }

            Toggle("In stock only", isOn: $inStockOnly)
                .font(.caption)
                .padding(.horizontal)
                .padding(.vertical, 8)

            Group {
                if catalog.isLoading && catalog.products.isEmpty {
                    ScrollView { SkeletonGrid().padding() }
                } else if let error = catalog.errorMessage, catalog.products.isEmpty {
                    ContentUnavailableView("Could not load", systemImage: "wifi.exclamationmark", description: Text(error))
                } else if visible.isEmpty {
                    ContentUnavailableView("No products", systemImage: "bag", description: Text("Try another category or search."))
                } else {
                    ScrollView {
                        LazyVGrid(
                            columns: [GridItem(.adaptive(minimum: 150), spacing: 12)],
                            spacing: 12
                        ) {
                            ForEach(visible) { product in
                                NavigationLink(value: product) {
                                    ProductCard(product: product)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding()
                    }
                }
            }
        }
        .background(Brand.surface.ignoresSafeArea())
        .navigationTitle("Shop")
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
        .navigationDestination(for: Product.self) { ProductDetailView(product: $0) }
        .task {
            if let initialCategory {
                selectedCategory = initialCategory
            }
            await catalog.loadIfNeeded()
        }
        .refreshable { await catalog.reload() }
    }
}

private struct CategoryChip: View {
    let title: String
    let selected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.caption.weight(.medium))
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(selected ? Brand.red : .white)
                .foregroundStyle(selected ? .white : Brand.ink)
                .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }
}
