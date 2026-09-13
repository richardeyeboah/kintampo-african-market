import SwiftUI

struct CartView: View {
    @Bindable private var cart = CartStore.shared

    var body: some View {
        Group {
            if cart.items.isEmpty {
                ContentUnavailableView(
                    "Cart is empty",
                    systemImage: "cart",
                    description: Text("Browse the shop and add items.")
                )
            } else {
                List {
                    ForEach(cart.items) { item in
                        HStack(spacing: 12) {
                            CachedProductImage(url: item.product.primaryImageURL)
                                .frame(width: 56, height: 56)
                                .clipped()
                                .clipShape(RoundedRectangle(cornerRadius: 8))

                            VStack(alignment: .leading, spacing: 4) {
                                Text(item.product.name)
                                    .font(.subheadline.weight(.medium))
                                    .lineLimit(2)
                                Text(item.product.displayPrice)
                                    .font(.caption)
                                    .foregroundStyle(Brand.red)
                            }

                            Spacer()

                            Stepper(
                                "\(item.quantity)",
                                value: Binding(
                                    get: { item.quantity },
                                    set: { cart.setQuantity(productID: item.product.id, quantity: $0) }
                                ),
                                in: 0...item.product.maxCartQuantity
                            )
                            .labelsHidden()
                        }
                        .padding(.vertical, 4)
                    }
                    .onDelete { indexSet in
                        cart.remove(at: indexSet)
                    }

                    Section {
                        HStack {
                            Text("Subtotal")
                            Spacer()
                            Text(String(format: "$%.2f", cart.subtotal))
                                .fontWeight(.semibold)
                                .foregroundStyle(Brand.red)
                        }
                    }
                }
                #if os(iOS) || os(macOS)
                .safeAreaInset(edge: .bottom) {
                    NavigationLink {
                        CheckoutView()
                    } label: {
                        Text("Checkout · \(String(format: "$%.2f", cart.subtotal))")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Brand.red)
                    .padding()
                    .background(.ultraThinMaterial)
                }
                #endif
            }
        }
        .navigationTitle("Cart")
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
    }
}
