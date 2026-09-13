import SwiftUI

/// Apple Watch — quick cart count, track order, open shop on phone.
struct WatchRootView: View {
    @Bindable private var cart = CartStore.shared
    @State private var tracker = OrderTrackViewModel()

    var body: some View {
        NavigationStack {
            List {
                Section("Cart") {
                    LabeledContent("Items", value: "\(cart.itemCount)")
                    LabeledContent("Subtotal", value: String(format: "$%.2f", cart.subtotal))
                }

                Section("Track") {
                    TextField("LQ-####", text: $tracker.orderID)
                    TextField("Email", text: $tracker.email)
                    Button("Track") {
                        Task { await tracker.track() }
                    }
                    if let order = tracker.order {
                        Text(order.status.replacingOccurrences(of: "_", with: " "))
                            .font(.caption)
                    }
                }

                Section {
                    Text("Full catalog on iPhone or Mac.")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Kintampo")
        }
    }
}
