import SwiftUI

struct TrackOrderView: View {
    @State private var tracker = OrderTrackViewModel()

    var body: some View {
        Form {
            Section("Order lookup") {
                TextField("Order # (e.g. LQ-1042)", text: $tracker.orderID)
                    #if os(iOS)
                    .textInputAutocapitalization(.characters)
                    #endif
                TextField("Email used at checkout", text: $tracker.email)
                    #if os(iOS)
                    .textInputAutocapitalization(.never)
                    .keyboardType(.emailAddress)
                    #endif
                Button(tracker.isLoading ? "Looking up…" : "Track order") {
                    Task { await tracker.track() }
                }
                .disabled(tracker.orderID.isEmpty || tracker.email.isEmpty || tracker.isLoading)
            }

            if let error = tracker.errorMessage {
                Section {
                    Text(error)
                        .foregroundStyle(.red)
                        .font(.caption)
                }
            }

            if let order = tracker.order {
                Section("Status") {
                    LabeledContent("Order", value: order.displayNumber)
                    LabeledContent("Status", value: order.status.replacingOccurrences(of: "_", with: " ").capitalized)
                    if let total = order.totalAmount {
                        LabeledContent("Total", value: String(format: "$%.2f", total))
                    }
                    if let tracking = order.trackingNumber, !tracking.isEmpty {
                        LabeledContent("Tracking", value: tracking)
                    }
                }
            }
        }
        .navigationTitle("Track")
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
    }
}
