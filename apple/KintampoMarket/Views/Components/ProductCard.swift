import SwiftUI

struct ProductCard: View {
    let product: Product
    var compact = false
    var showQuickAdd = true

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            CachedProductImage(url: product.primaryImageURL)
                .frame(height: compact ? 100 : 140)
                .clipped()
                .clipShape(RoundedRectangle(cornerRadius: 8))

            Text(product.name)
                .font(.subheadline.weight(.medium))
                .foregroundStyle(Brand.ink)
                .lineLimit(2)
                .frame(maxWidth: .infinity, alignment: .leading)

            HStack(alignment: .center) {
                Text(product.displayPrice)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Brand.red)
                Spacer(minLength: 4)
                if !product.effectiveInStock {
                    Text("Out")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                } else if showQuickAdd {
                    Button {
                        CartStore.shared.add(product, quantity: 1)
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.title3)
                            .foregroundStyle(Brand.red)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Add to cart")
                }
            }
        }
        .padding(compact ? 8 : 12)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .shadow(color: .black.opacity(0.05), radius: 3, y: 1)
    }
}

struct SkeletonGrid: View {
    var body: some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 150), spacing: 12)], spacing: 12) {
            ForEach(0..<6, id: \.self) { _ in
                RoundedRectangle(cornerRadius: 10)
                    .fill(Color.gray.opacity(0.12))
                    .frame(height: 200)
            }
        }
    }
}
