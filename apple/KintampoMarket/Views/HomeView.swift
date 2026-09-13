import SwiftUI

struct HomeView: View {
    @Bindable private var catalog = CatalogStore.shared

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(StoreConfig.shortName)
                        .font(.largeTitle.weight(.bold))
                        .foregroundStyle(Brand.ink)
                    Text(StoreConfig.tagline)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal)

                if !AppConfig.isConfigured {
                    ConfigBanner()
                        .padding(.horizontal)
                }

                VStack(alignment: .leading, spacing: 12) {
                    Text("Shop by category")
                        .font(.headline)
                        .padding(.horizontal)

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 10) {
                            ForEach(StoreConfig.productCategories.prefix(10), id: \.self) { cat in
                                NavigationLink(value: cat) {
                                    Text(cat)
                                        .font(.caption.weight(.medium))
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 8)
                                        .background(Brand.surface)
                                        .clipShape(Capsule())
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.horizontal)
                    }
                }

                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text("New arrivals")
                            .font(.headline)
                        Spacer()
                        if catalog.isLoading && catalog.products.isEmpty {
                            ProgressView()
                                .controlSize(.small)
                        }
                    }
                    .padding(.horizontal)

                    if catalog.isLoading && catalog.products.isEmpty {
                        SkeletonGrid().padding(.horizontal)
                    } else if let errorMessage = catalog.errorMessage, catalog.products.isEmpty {
                        Text(errorMessage)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .padding(.horizontal)
                    } else {
                        LazyVGrid(
                            columns: [GridItem(.adaptive(minimum: 150), spacing: 12)],
                            spacing: 12
                        ) {
                            ForEach(catalog.featured(limit: 12)) { product in
                                NavigationLink(value: product) {
                                    ProductCard(product: product)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.horizontal)
                    }
                }

                if !RecentlyViewedStore.shared.products.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Recently viewed")
                            .font(.headline)
                            .padding(.horizontal)
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 12) {
                                ForEach(RecentlyViewedStore.shared.products.prefix(8)) { product in
                                    NavigationLink(value: product) {
                                        ProductCard(product: product, compact: true, showQuickAdd: false)
                                            .frame(width: 140)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                }

                NavigationLink {
                    BundlesView()
                } label: {
                    HStack {
                        Text("Shop bundles")
                            .font(.headline)
                        Spacer()
                        Image(systemName: "chevron.right")
                            .foregroundStyle(.secondary)
                    }
                    .padding()
                    .background(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    .padding(.horizontal)
                }
                .buttonStyle(.plain)

                StoreInfoCard()
                    .padding(.horizontal)
            }
            .padding(.vertical)
        }
        .background(Brand.surface.ignoresSafeArea())
        .navigationTitle("Home")
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
        .refreshable { await catalog.reload() }
        .navigationDestination(for: Product.self) { ProductDetailView(product: $0) }
        .navigationDestination(for: String.self) { category in
            ShopView(initialCategory: category)
        }
    }
}

private struct StoreInfoCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label(StoreConfig.address, systemImage: "mappin.and.ellipse")
            Label(StoreConfig.phone, systemImage: "phone.fill")
            Label(StoreConfig.hours, systemImage: "clock.fill")
        }
        .font(.caption)
        .foregroundStyle(.secondary)
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }
}

private struct ConfigBanner: View {
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundStyle(Brand.gold)
            Text("Missing Supabase keys in Config.xcconfig.")
                .font(.caption)
        }
        .padding(12)
        .background(Brand.gold.opacity(0.15))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}
