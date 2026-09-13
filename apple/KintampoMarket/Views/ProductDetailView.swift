import SwiftUI

struct ProductDetailView: View {
    let product: Product
    @State private var quantity = 1
    @State private var added = false
    @Bindable private var wishlist = WishlistStore.shared
    @Bindable private var auth = AuthStore.shared

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                CachedProductImage(url: product.primaryImageURL)
                    .frame(height: 280)
                    .clipped()
                    .clipShape(RoundedRectangle(cornerRadius: 12))

                HStack(alignment: .top) {
                    Text(product.name)
                        .font(.title2.weight(.semibold))
                        .foregroundStyle(Brand.ink)
                    Spacer()
                    if auth.isSignedIn {
                        Button {
                            Task { await wishlist.toggle(product) }
                        } label: {
                            Image(systemName: wishlist.contains(product.id) ? "heart.fill" : "heart")
                                .font(.title3)
                                .foregroundStyle(Brand.red)
                        }
                        .buttonStyle(.plain)
                    }
                }

                HStack {
                    Text(product.displayPrice)
                        .font(.title3.weight(.bold))
                        .foregroundStyle(Brand.red)
                    if let pack = product.packLabel, !pack.isEmpty {
                        Text(pack).font(.caption).foregroundStyle(.secondary)
                    }
                    Spacer()
                    Text(product.effectiveInStock ? "In stock" : "Out of stock")
                        .font(.caption.weight(.medium))
                        .foregroundStyle(product.effectiveInStock ? .green : .secondary)
                }

                if let description = product.description, !description.isEmpty {
                    Text(description).font(.body).foregroundStyle(.secondary)
                }

                Stepper("Qty: \(quantity)", value: $quantity, in: 1...99)
                    .font(.subheadline)

                Button {
                    CartStore.shared.add(product, quantity: quantity)
                    added = true
                } label: {
                    Text(added ? "Added to cart" : "Add to cart")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                }
                .buttonStyle(.borderedProminent)
                .tint(Brand.red)
                .disabled(!product.effectiveInStock)
            }
            .padding()
        }
        .background(Brand.surface.ignoresSafeArea())
        .navigationTitle("Product")
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
        .onAppear { RecentlyViewedStore.shared.record(product) }
        .task { if auth.isSignedIn { await wishlist.refresh() } }
    }
}
