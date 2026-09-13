import SwiftUI

struct ProductDetailView: View {
    let product: Product
    @State private var detail: Product
    @State private var quantity = 1
    @State private var added = false
    @State private var isLoadingDetail = false
    @State private var selectedImageIndex = 0
    @Bindable private var wishlist = WishlistStore.shared
    @Bindable private var auth = AuthStore.shared

    init(product: Product) {
        self.product = product
        _detail = State(initialValue: product)
    }

    private var galleryURLs: [URL] {
        var urls: [URL] = []
        if let main = detail.primaryImageURL { urls.append(main) }
        for raw in detail.imageURLs ?? [] {
            guard let url = URL(string: raw), !urls.contains(url) else { continue }
            urls.append(url)
        }
        return urls
    }

    private var maxQty: Int {
        max(1, detail.maxCartQuantity == 0 ? 1 : detail.maxCartQuantity)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                gallery

                HStack(alignment: .top) {
                    Text(detail.name)
                        .font(.title2.weight(.semibold))
                        .foregroundStyle(Brand.ink)
                    Spacer(minLength: 8)
                    HStack(spacing: 12) {
                        ShareLink(
                            item: StorefrontCatalog.publicProductURL(id: detail.id),
                            subject: Text(detail.name),
                            message: Text("\(detail.name) — order at Kintampo African Market")
                        ) {
                            Image(systemName: "square.and.arrow.up")
                                .font(.title3)
                                .foregroundStyle(Brand.ink.opacity(0.7))
                                .frame(minWidth: 44, minHeight: 44)
                        }
                        .buttonStyle(.plain)

                        if auth.isSignedIn {
                            Button {
                                Task { await wishlist.toggle(detail) }
                            } label: {
                                Image(systemName: wishlist.contains(detail.id) ? "heart.fill" : "heart")
                                    .font(.title3)
                                    .foregroundStyle(Brand.red)
                                    .frame(minWidth: 44, minHeight: 44)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }

                HStack {
                    Text(detail.displayPrice)
                        .font(.title3.weight(.bold))
                        .foregroundStyle(Brand.red)
                    if let pack = detail.packLabel, !pack.isEmpty {
                        Text(pack).font(.caption).foregroundStyle(.secondary)
                    }
                    Spacer()
                    Text(detail.effectiveInStock ? "In stock" : "Out of stock")
                        .font(.caption.weight(.medium))
                        .foregroundStyle(detail.effectiveInStock ? .green : .secondary)
                }

                if let brand = detail.brand?.trimmingCharacters(in: .whitespacesAndNewlines), !brand.isEmpty {
                    Text(brand)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .textCase(.uppercase)
                }

                if isLoadingDetail, detail.description == nil {
                    ProgressView()
                        .frame(maxWidth: .infinity, alignment: .leading)
                } else if let description = detail.description, !description.isEmpty {
                    Text(description).font(.body).foregroundStyle(.secondary)
                }

                Stepper("Qty: \(quantity)", value: $quantity, in: 1...maxQty)
                    .font(.subheadline)
                    .disabled(!detail.effectiveInStock)

                Button {
                    CartStore.shared.add(detail, quantity: quantity)
                    added = true
                } label: {
                    Text(added ? "Added to cart" : "Add to cart")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                }
                .buttonStyle(.borderedProminent)
                .tint(Brand.red)
                .disabled(!detail.effectiveInStock)
                .accessibilityIdentifier("addToCart")
            }
            .padding()
        }
        .background(Brand.surface.ignoresSafeArea())
        .navigationTitle(detail.category)
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
        .onAppear { RecentlyViewedStore.shared.record(detail) }
        .task {
            if auth.isSignedIn { await wishlist.refresh() }
            await loadFullProduct()
        }
        .onChange(of: added) { _, value in
            guard value else { return }
            Task {
                try? await Task.sleep(nanoseconds: 1_200_000_000)
                added = false
            }
        }
    }

    @ViewBuilder
    private var gallery: some View {
        let urls = galleryURLs
        if urls.isEmpty {
            CachedProductImage(url: nil)
                .frame(height: 280)
                .clipShape(RoundedRectangle(cornerRadius: 12))
        } else {
            VStack(spacing: 8) {
                TabView(selection: $selectedImageIndex) {
                    ForEach(Array(urls.enumerated()), id: \.offset) { index, url in
                        CachedProductImage(url: url)
                            .frame(height: 280)
                            .clipped()
                            .tag(index)
                    }
                }
                #if os(iOS)
                .tabViewStyle(.page(indexDisplayMode: urls.count > 1 ? .automatic : .never))
                #endif
                .frame(height: 280)
                .clipShape(RoundedRectangle(cornerRadius: 12))

                if urls.count > 1 {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(Array(urls.enumerated()), id: \.offset) { index, url in
                                Button {
                                    selectedImageIndex = index
                                } label: {
                                    CachedProductImage(url: url)
                                        .frame(width: 56, height: 56)
                                        .clipShape(RoundedRectangle(cornerRadius: 8))
                                        .overlay {
                                            RoundedRectangle(cornerRadius: 8)
                                                .stroke(index == selectedImageIndex ? Brand.red : Color.clear, lineWidth: 2)
                                        }
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                }
            }
        }
    }

    private func loadFullProduct() async {
        isLoadingDetail = true
        defer { isLoadingDetail = false }
        do {
            if let full = try await SupabaseService.shared.fetchProduct(id: product.id),
               !StorefrontCatalog.isHidden(full)
            {
                detail = full
                RecentlyViewedStore.shared.record(full)
            }
        } catch {
            // Keep list payload; detail fields stay optional.
        }
    }
}
