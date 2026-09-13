#if os(iOS)
import SwiftUI
import StripePaymentSheet

struct NativePaymentView: View {
    let payment: PaymentIntentResult
    let onComplete: (String) -> Void
    @State private var sheet: PaymentSheet?
    @State private var message = "Review your total, then continue to secure payment."
    @State private var paymentSubmitted = false
    @State private var checking = false

    var body: some View {
        VStack(spacing: 20) {
            Text("Kintampo African Market").font(.headline)
            LabeledContent("Subtotal", value: money(payment.subtotal))
            LabeledContent("Delivery / shipping", value: money(payment.shippingFee))
            LabeledContent("Tax", value: money(payment.taxAmount))
            LabeledContent("Total (including any tip)", value: money(payment.total)).font(.headline)
            if let sheet, !paymentSubmitted {
                PaymentSheet.PaymentButton(paymentSheet: sheet, onCompletion: handleResult) {
                    Text("Pay \(money(payment.total))").frame(maxWidth: .infinity).padding()
                }
                .buttonStyle(.borderedProminent)
            }
            Text(message).font(.subheadline).accessibilityIdentifier("paymentStatus")
            Button(checking ? "Checking…" : "Check payment status") {
                Task { await confirmOrder() }
            }
            .disabled(checking)
            Spacer()
        }
        .padding()
        .navigationTitle("Payment")
        .task {
            STPAPIClient.shared.publishableKey = payment.publishableKey ?? AppConfig.stripePublishableKey
            var config = PaymentSheet.Configuration()
            config.merchantDisplayName = "Kintampo African Market"
            config.returnURL = "kintampo://stripe-redirect"
            config.allowsDelayedPaymentMethods = false
            sheet = PaymentSheet(paymentIntentClientSecret: payment.clientSecret, configuration: config)
        }
    }

    private func money(_ amount: Double) -> String { String(format: "$%.2f", amount) }

    private func handleResult(_ result: PaymentSheetResult) {
        switch result {
        case .completed:
            paymentSubmitted = true
            Task { await confirmOrder() }
        case .canceled:
            message = "Payment canceled. You can try again."
        case .failed(let error):
            message = error.localizedDescription
        }
    }

    private func confirmOrder() async {
        guard !checking else { return }
        checking = true
        defer { checking = false }
        do {
            let token = try await AuthStore.shared.validAccessToken()
            let result = try await APIClient.shared.checkoutStatus(paymentIntentId: payment.intentID, accessToken: token)
            if let confirmation = result.confirmationMessage {
                onComplete(confirmation)
            } else {
                message = "Your order is not confirmed yet. Check again before making another payment."
            }
        } catch {
            message = "Could not check your order. Your cart is saved. Please try checking again."
        }
    }
}
#endif
