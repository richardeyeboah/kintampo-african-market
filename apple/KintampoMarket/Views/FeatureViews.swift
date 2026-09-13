import SwiftUI
import WebKit
#if os(macOS)
import AppKit
#endif

// MARK: - Checkout

struct CheckoutView: View {
    @Bindable private var cart = CartStore.shared
    @Bindable private var auth = AuthStore.shared
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var address1 = ""
    @State private var address2 = ""
    @State private var city = "Columbus"
    @State private var state = "OH"
    @State private var postalCode = ""
    @State private var shipping: ShippingMethodOption = .pickup
    @State private var pickupSlot: PickupSlotOption = .today_asap
    @State private var pickupName = ""
    @State private var substitution: SubstitutionOption = .refund
    @State private var tip: Double = 0
    @State private var isSubmitting = false
    @State private var errorMessage: String?
    @State private var payment: PaymentIntentResult?
    @State private var showPaySheet = false
    @State private var orderDoneMessage: String?
    @AppStorage("kintampo-pending-payment") private var pendingPaymentID = ""
    @AppStorage("kintampo-pending-cart") private var pendingCart = Data()

    var body: some View {
        Form {
            if let orderDoneMessage {
                Section {
                    Text(orderDoneMessage)
                        .foregroundStyle(.green)
                    Button("Done") {
                        dismiss()
                    }
                }
            } else {
                Section("Contact") {
                    TextField("Full name", text: $name)
                    TextField("Email", text: $email)
                        #if os(iOS)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                        #endif
                    TextField("Phone", text: $phone)
                        #if os(iOS)
                        .keyboardType(.phonePad)
                        #endif
                }

                Section("Fulfillment") {
                    Picker("Method", selection: $shipping) {
                        ForEach(ShippingMethodOption.allCases) { method in
                            Text("\(method.label) · \(method.hint)").tag(method)
                        }
                    }
                    if shipping == .pickup {
                        Picker("Pickup window", selection: $pickupSlot) {
                            ForEach(PickupSlotOption.allCases) { slot in
                                Text(slot.label).tag(slot)
                            }
                        }
                        TextField("Who is picking up?", text: $pickupName)
                    } else {
                        TextField("Address line 1", text: $address1)
                        TextField("Apt / suite", text: $address2)
                        TextField("City", text: $city)
                        TextField("State", text: $state)
                        TextField("ZIP", text: $postalCode)
                            #if os(iOS)
                            .keyboardType(.numberPad)
                            #endif
                    }
                }

                Section("If an item is out") {
                    Picker("Preference", selection: $substitution) {
                        ForEach(SubstitutionOption.allCases) { opt in
                            Text(opt.label).tag(opt)
                        }
                    }
                }

                if shipping == .local_delivery {
                    Section("Driver tip") {
                        Picker("Tip", selection: $tip) {
                            Text("$0").tag(0.0)
                            Text("$2").tag(2.0)
                            Text("$3").tag(3.0)
                            Text("$5").tag(5.0)
                        }
                        .pickerStyle(.segmented)
                    }
                }

                Section("Order") {
                    ForEach(cart.items) { item in
                        HStack {
                            Text("\(item.quantity)× \(item.product.name)")
                                .lineLimit(1)
                            Spacer()
                            Text(String(format: "$%.2f", item.lineTotal))
                        }
                        .font(.subheadline)
                    }
                    LabeledContent("Cart subtotal", value: String(format: "$%.2f", cart.subtotal))
                }

                if let errorMessage {
                    Section { Text(errorMessage).foregroundStyle(.red).font(.caption) }
                }

                Section {
                    Button(isSubmitting ? "Please wait…" : (pendingPaymentID.isEmpty ? "Pay with card" : "Check previous payment")) {
                        Task { await startPayment() }
                    }
                    .disabled(isSubmitting || cart.items.isEmpty)
                    .tint(Brand.red)
                }
            }
        }
        .navigationTitle("Checkout")
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
        .onAppear {
            if email.isEmpty { email = auth.email }
            if name.isEmpty { name = auth.profile?.fullName ?? "" }
            if phone.isEmpty { phone = auth.profile?.phone ?? "" }
            if pickupName.isEmpty { pickupName = name }
        }
        .sheet(isPresented: $showPaySheet) {
            if let payment {
                NavigationStack {
                    Group {
                    #if os(iOS)
                    NativePaymentView(payment: payment) { message in
                        completeOrder(message)
                    }
                    #else
                    StripePayView(
                        publishableKey: payment.publishableKey ?? AppConfig.stripePublishableKey,
                        clientSecret: payment.clientSecret,
                        paymentIntentId: payment.paymentIntentId
                            ?? String(payment.clientSecret.split(separator: "_").prefix(2).joined(separator: "_")),
                        total: payment.total
                    ) { successMessage in
                        completeOrder(successMessage)
                    }
                    #endif
                    }
                    .toolbar {
                        ToolbarItem(placement: .cancellationAction) {
                            Button("Cancel") { showPaySheet = false }
                        }
                    }
                }
            }
        }
        .task {
            if auth.isSignedIn, let addresses = try? await SupabaseService.shared.fetchAddresses(),
               let preferred = addresses.first {
                applyAddress(preferred)
            }
        }
    }

    private func applyAddress(_ a: SavedAddress) {
        if name.isEmpty { name = a.fullName }
        if phone.isEmpty { phone = a.phone ?? "" }
        address1 = a.line1
        address2 = a.line2 ?? ""
        city = a.city
        state = a.state
        postalCode = a.postalCode
    }

    private func completeOrder(_ message: String) {
        pendingPaymentID = ""
        if let purchased = try? JSONDecoder().decode([CartItem].self, from: pendingCart) {
            cart.removePurchased(purchased)
        }
        pendingCart = Data()
        showPaySheet = false
        orderDoneMessage = message
    }

    private func startPayment() async {
        errorMessage = nil
        isSubmitting = true
        defer { isSubmitting = false }
        do {
            let token = try await auth.validAccessToken()
            if !pendingPaymentID.isEmpty {
                let previous = try await APIClient.shared.checkoutStatus(paymentIntentId: pendingPaymentID, accessToken: token)
                if let confirmation = previous.confirmationMessage {
                    completeOrder(confirmation)
                    return
                }
                guard previous.canStartNewPayment else {
                    errorMessage = "Your previous payment is still unresolved. Check again before paying. Your cart is saved."
                    return
                }
                pendingPaymentID = ""
            }
            let checkoutItems = cart.items
            let result = try await APIClient.shared.createPaymentIntent(
                name: name,
                email: email,
                phone: phone,
                address1: address1,
                address2: address2,
                city: city,
                state: state,
                postalCode: postalCode,
                country: "United States",
                items: checkoutItems,
                shippingMethod: shipping.rawValue,
                pickupName: shipping == .pickup ? (pickupName.isEmpty ? name : pickupName) : nil,
                substitutionPref: substitution.rawValue,
                pickupSlot: shipping == .pickup ? pickupSlot.rawValue : nil,
                tipAmount: tip,
                accessToken: token
            )
            payment = result
            pendingCart = try JSONEncoder().encode(checkoutItems)
            pendingPaymentID = result.intentID
            showPaySheet = true
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

// MARK: - Stripe Payment Element (WKWebView)

#if os(iOS) || os(macOS)
struct StripePayView: View {
    let publishableKey: String
    let clientSecret: String
    let paymentIntentId: String
    let total: Double
    var onComplete: (String) -> Void

    @State private var statusText = "Loading secure card form…"
    @State private var isConfirming = false

    var body: some View {
        VStack(spacing: 0) {
            Text(String(format: "Pay $%.2f", total))
                .font(.headline)
                .padding()
            StripeWebView(
                html: stripeHTML(publishableKey: publishableKey, clientSecret: clientSecret),
                onEvent: handleEvent
            )
            Button(isConfirming ? "Checking…" : "Check order status") {
                Task { await pollStatus() }
            }.disabled(isConfirming)
            Text(statusText)
                .font(.caption)
                .foregroundStyle(.secondary)
                .padding()
        }
        .navigationTitle("Payment")
    }

    private func handleEvent(_ name: String, _ payload: String) {
        switch name {
        case "ready":
            statusText = "Enter card details"
        case "error":
            statusText = payload
        case "success":
            statusText = "Confirming order…"
            Task { await pollStatus() }
        default:
            break
        }
    }

    private func pollStatus() async {
        guard !isConfirming else { return }
        isConfirming = true
        defer { isConfirming = false }
        for _ in 0..<20 {
            guard !Task.isCancelled else { return }
            do {
                let result = try await APIClient.shared.checkoutStatus(
                    paymentIntentId: paymentIntentId.isEmpty
                        ? extractPaymentIntentId(from: clientSecret)
                        : paymentIntentId,
                    accessToken: try await AuthStore.shared.validAccessToken()
                )
                if let confirmation = result.confirmationMessage {
                    onComplete(confirmation)
                    return
                }
                if result.status == "unpaid" {
                    statusText = "Payment not finished yet"
                    return
                }
            } catch {
                statusText = error.localizedDescription
            }
            try? await Task.sleep(nanoseconds: 1_000_000_000)
        }
        statusText = "Order confirmation is still pending. Your cart is saved. Check again before paying."

    }

    private func extractPaymentIntentId(from secret: String) -> String {
        // pi_xxx_secret_yyy
        let parts = secret.split(separator: "_")
        if parts.count >= 2 { return "\(parts[0])_\(parts[1])" }
        return secret
    }
}

private func stripeHTML(publishableKey: String, clientSecret: String) -> String {
    """
    <!DOCTYPE html><html><head>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <script src="https://js.stripe.com/v3/"></script>
    <style>
      body{font-family:-apple-system,sans-serif;margin:16px;background:#fafaf9;color:#1c1917}
      #payment-element{margin:12px 0;padding:12px;background:#fff;border-radius:10px}
      button{width:100%;padding:14px;background:#CE1126;color:#fff;border:0;border-radius:10px;font-size:16px;font-weight:600}
      button:disabled{opacity:.5}
      #msg{color:#b91c1c;font-size:13px;min-height:18px}
    </style></head><body>
    <div id="payment-element"></div>
    <p id="msg"></p>
    <button id="pay">Pay now</button>
    <script>
      const stripe = Stripe('\(publishableKey)');
      const elements = stripe.elements({ clientSecret: '\(clientSecret)' });
      const paymentElement = elements.create('payment');
      paymentElement.mount('#payment-element');
      paymentElement.on('ready', () => window.webkit.messageHandlers.kintampo.postMessage({name:'ready',payload:''}));
      document.getElementById('pay').onclick = async () => {
        document.getElementById('pay').disabled = true;
        const {error} = await stripe.confirmPayment({
          elements,
          redirect: 'if_required'
        });
        if (error) {
          document.getElementById('msg').textContent = error.message || 'Payment failed';
          document.getElementById('pay').disabled = false;
          window.webkit.messageHandlers.kintampo.postMessage({name:'error',payload:error.message||'Payment failed'});
        } else {
          window.webkit.messageHandlers.kintampo.postMessage({name:'success',payload:''});
        }
      };
    </script></body></html>
    """
}

#if os(iOS)
struct StripeWebView: UIViewRepresentable {
    let html: String
    var onEvent: (String, String) -> Void

    func makeCoordinator() -> Coordinator { Coordinator(onEvent: onEvent) }

    func makeUIView(context: Context) -> WKWebView {
        let content = WKUserContentController()
        content.add(context.coordinator, name: "kintampo")
        let config = WKWebViewConfiguration()
        config.userContentController = content
        let web = WKWebView(frame: .zero, configuration: config)
        web.loadHTMLString(html, baseURL: URL(string: "https://kintampoafricanmarket.com"))
        return web
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKScriptMessageHandler {
        let onEvent: (String, String) -> Void
        init(onEvent: @escaping (String, String) -> Void) { self.onEvent = onEvent }
        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard let body = message.body as? [String: Any],
                  let name = body["name"] as? String else { return }
            let payload = body["payload"] as? String ?? ""
            DispatchQueue.main.async { self.onEvent(name, payload) }
        }
    }
}
#elseif os(macOS)
struct StripeWebView: NSViewRepresentable {
    let html: String
    var onEvent: (String, String) -> Void

    func makeCoordinator() -> Coordinator { Coordinator(onEvent: onEvent) }

    func makeNSView(context: Context) -> WKWebView {
        let content = WKUserContentController()
        content.add(context.coordinator, name: "kintampo")
        let config = WKWebViewConfiguration()
        config.userContentController = content
        let web = WKWebView(frame: .zero, configuration: config)
        web.loadHTMLString(html, baseURL: URL(string: "https://kintampoafricanmarket.com"))
        return web
    }

    func updateNSView(_ nsView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKScriptMessageHandler {
        let onEvent: (String, String) -> Void
        init(onEvent: @escaping (String, String) -> Void) { self.onEvent = onEvent }
        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard let body = message.body as? [String: Any],
                  let name = body["name"] as? String else { return }
            let payload = body["payload"] as? String ?? ""
            DispatchQueue.main.async { self.onEvent(name, payload) }
        }
    }
}
#endif
#endif

// MARK: - Wishlist / Addresses / Bundles / Orders

struct WishlistView: View {
    @Bindable private var wishlist = WishlistStore.shared
    @Bindable private var auth = AuthStore.shared

    var body: some View {
        Group {
            if !auth.isSignedIn {
                ContentUnavailableView("Sign in to save items", systemImage: "heart", description: Text("Wishlist syncs to your account."))
            } else if wishlist.isLoading && wishlist.products.isEmpty {
                ProgressView()
            } else if wishlist.products.isEmpty {
                ContentUnavailableView("No saved items", systemImage: "heart", description: Text("Tap the heart on a product."))
            } else {
                List {
                    ForEach(wishlist.products) { product in
                        NavigationLink(value: product) {
                            HStack {
                                CachedProductImage(url: product.primaryImageURL)
                                    .frame(width: 48, height: 48)
                                    .clipShape(RoundedRectangle(cornerRadius: 6))
                                VStack(alignment: .leading) {
                                    Text(product.name).lineLimit(2)
                                    Text(product.displayPrice).foregroundStyle(Brand.red)
                                }
                            }
                        }
                        .swipeActions {
                            Button("Remove", role: .destructive) {
                                Task { await wishlist.toggle(product) }
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle("Wishlist")
        .navigationDestination(for: Product.self) { ProductDetailView(product: $0) }
        .task { await wishlist.refresh() }
        .refreshable { await wishlist.refresh() }
    }
}

struct AddressesView: View {
    @Bindable private var auth = AuthStore.shared
    @State private var addresses: [SavedAddress] = []
    @State private var errorMessage: String?
    @State private var draft = AddressDraft()
    @State private var showAdd = false

    var body: some View {
        Group {
            if !auth.isSignedIn {
                ContentUnavailableView("Sign in required", systemImage: "mappin.and.ellipse")
            } else {
                List {
                    ForEach(addresses) { address in
                        VStack(alignment: .leading, spacing: 4) {
                            HStack {
                                Text(address.label?.isEmpty == false ? address.label! : "Address")
                                    .font(.headline)
                                if address.isDefault {
                                    Text("Default").font(.caption2).foregroundStyle(Brand.gold)
                                }
                            }
                            Text(address.fullName)
                            Text(address.oneLine).font(.caption).foregroundStyle(.secondary)
                        }
                        .swipeActions {
                            Button("Delete", role: .destructive) {
                                Task {
                                    try? await SupabaseService.shared.deleteAddress(id: address.id)
                                    await reload()
                                }
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle("Addresses")
        .toolbar {
            if auth.isSignedIn {
                Button { showAdd = true } label: { Image(systemName: "plus") }
            }
        }
        .sheet(isPresented: $showAdd) {
            NavigationStack {
                Form {
                    TextField("Label", text: $draft.label)
                    TextField("Full name", text: $draft.fullName)
                    TextField("Phone", text: $draft.phone)
                    TextField("Line 1", text: $draft.line1)
                    TextField("Line 2", text: $draft.line2)
                    TextField("City", text: $draft.city)
                    TextField("State", text: $draft.state)
                    TextField("ZIP", text: $draft.postalCode)
                    Toggle("Default address", isOn: $draft.isDefault)
                    if let errorMessage { Text(errorMessage).foregroundStyle(.red) }
                }
                .navigationTitle("Add address")
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) { Button("Cancel") { showAdd = false } }
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Save") { Task { await save() } }
                    }
                }
            }
        }
        .task { await reload() }
    }

    private func reload() async {
        guard auth.isSignedIn else { return }
        addresses = (try? await SupabaseService.shared.fetchAddresses()) ?? []
    }

    private func save() async {
        errorMessage = nil
        let address = SavedAddress(
            id: UUID().uuidString,
            userId: auth.userId,
            label: draft.label,
            fullName: draft.fullName,
            phone: draft.phone,
            line1: draft.line1,
            line2: draft.line2,
            city: draft.city,
            state: draft.state,
            country: "United States",
            postalCode: draft.postalCode,
            isDefault: draft.isDefault
        )
        do {
            try await SupabaseService.shared.saveAddress(address)
            showAdd = false
            draft = AddressDraft()
            await reload()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

private struct AddressDraft {
    var label = "Home"
    var fullName = ""
    var phone = ""
    var line1 = ""
    var line2 = ""
    var city = "Columbus"
    var state = "OH"
    var postalCode = ""
    var isDefault = true
}

struct BundlesView: View {
    @State private var bundles: [ProductBundle] = []
    @State private var errorMessage: String?

    var body: some View {
        Group {
            if let errorMessage, bundles.isEmpty {
                ContentUnavailableView("Could not load", systemImage: "shippingbox", description: Text(errorMessage))
            } else if bundles.isEmpty {
                ContentUnavailableView("No bundles yet", systemImage: "shippingbox")
            } else {
                List(bundles) { bundle in
                    NavigationLink(value: bundle) {
                        HStack(spacing: 12) {
                            CachedProductImage(url: bundle.image)
                                .frame(width: 56, height: 56)
                                .clipShape(RoundedRectangle(cornerRadius: 8))
                            VStack(alignment: .leading) {
                                Text(bundle.name).font(.headline)
                                if bundle.discountPercent > 0 {
                                    Text("\(Int(bundle.discountPercent))% off")
                                        .font(.caption)
                                        .foregroundStyle(Brand.gold)
                                }
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle("Bundles")
        .navigationDestination(for: ProductBundle.self) { BundleDetailView(bundle: $0) }
        .task {
            do { bundles = try await SupabaseService.shared.fetchBundles() }
            catch { errorMessage = error.localizedDescription }
        }
    }
}

struct BundleDetailView: View {
    let bundle: ProductBundle
    @State private var products: [(Product, Int)] = []
    @State private var added = false

    var body: some View {
        List {
            Section {
                if let desc = bundle.description, !desc.isEmpty {
                    Text(desc)
                }
            }
            Section("Includes") {
                ForEach(products, id: \.0.id) { product, qty in
                    HStack {
                        Text("\(qty)× \(product.name)")
                        Spacer()
                        Text(product.displayPrice).foregroundStyle(Brand.red)
                    }
                }
            }
            Section {
                Button(added ? "Added to cart" : "Add bundle to cart") {
                    for (product, qty) in products {
                        CartStore.shared.add(product, quantity: qty)
                    }
                    added = true
                }
                .tint(Brand.red)
                .disabled(products.isEmpty)
            }
        }
        .navigationTitle(bundle.name)
        .task {
            let rows = (try? await SupabaseService.shared.fetchBundleItems(bundleID: bundle.id)) ?? []
            let ids = rows.map(\.productId)
            let fetched = (try? await SupabaseService.shared.fetchProductsByIDs(ids)) ?? []
            let map = Dictionary(uniqueKeysWithValues: fetched.map { ($0.id, $0) })
            products = rows.compactMap { row in
                guard let p = map[row.productId] else { return nil }
                return (p, row.quantity)
            }
        }
    }
}

struct OrdersView: View {
    @Bindable private var auth = AuthStore.shared
    @State private var orders: [TrackedOrder] = []
    @State private var loadError: String?

    var body: some View {
        Group {
            if !auth.isSignedIn {
                ContentUnavailableView("Sign in to see orders", systemImage: "list.bullet.rectangle")
            } else if let loadError {
                ContentUnavailableView("Could not load orders", systemImage: "exclamationmark.triangle", description: Text(loadError))
            } else if orders.isEmpty {
                ContentUnavailableView("No orders yet", systemImage: "list.bullet.rectangle")
            } else {
                List(orders, id: \.id) { order in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(order.displayNumber).font(.headline)
                        Text(order.status.replacingOccurrences(of: "_", with: " ").capitalized)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        if let total = order.totalAmount {
                            Text(String(format: "$%.2f", total)).foregroundStyle(Brand.red)
                        }
                    }
                }
            }
        }
        .navigationTitle("Orders")
        .task { await reload() }
        .refreshable { await reload() }
    }
    private func reload() async {
        loadError = nil
        do {
            guard try await auth.validAccessToken() != nil else { orders = []; return }
            orders = try await SupabaseService.shared.fetchMyOrders()
        } catch { loadError = error.localizedDescription }
    }

}

struct SignUpView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var firstName = ""
    @State private var lastName = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var password = ""
    @State private var errorMessage: String?
    @State private var isLoading = false
    @State private var termsAccepted = false

    var body: some View {
        Form {
            TextField("First name", text: $firstName)
            TextField("Last name", text: $lastName)
            TextField("Email", text: $email)
            TextField("Phone", text: $phone)
            SecureField("Password", text: $password)
            Text("Use 8 or more characters with uppercase, lowercase, a number, and a symbol.")
                .font(.caption).foregroundStyle(.secondary)
            Toggle("I agree to the Terms and Privacy Policy", isOn: $termsAccepted)
            Link("Terms", destination: AppConfig.siteURL.appending(path: "terms"))
            Link("Privacy Policy", destination: AppConfig.siteURL.appending(path: "privacy"))
            if let errorMessage { Text(errorMessage).foregroundStyle(.red).font(.caption) }
            Button(isLoading ? "Creating…" : "Create account") {
                Task {
                    isLoading = true
                    defer { isLoading = false }
                    do {
                        try await AuthStore.shared.signUp(
                            email: email,
                            password: password,
                            firstName: firstName,
                            lastName: lastName,
                            phone: phone
                        )
                        dismiss()
                    } catch {
                        errorMessage = error.localizedDescription
                    }
                }
            }
            .disabled(isLoading || !termsAccepted || email.isEmpty || password.count < 8 || firstName.isEmpty || lastName.isEmpty)
        }
        .navigationTitle("Sign up")
    }


}
