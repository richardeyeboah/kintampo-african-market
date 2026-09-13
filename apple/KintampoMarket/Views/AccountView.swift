import SwiftUI

struct AccountView: View {
    @Bindable private var auth = AuthStore.shared
    @State private var password = ""
    @State private var errorMessage: String?
    @State private var isLoading = false
    @State private var showSignUp = false
    @State private var editName = ""
    @State private var editPhone = ""
    @Environment(\.openURL) private var openURL

    var body: some View {
        Form {
            if auth.isSignedIn {
                Section("Account") {
                    Text(auth.email).font(.subheadline)
                    TextField("Full name", text: $editName)
                    TextField("Phone", text: $editPhone)
                    Button("Save profile") {
                        Task {
                            do {
                                try await auth.updateProfile(fullName: editName, phone: editPhone)
                                errorMessage = nil
                            } catch { errorMessage = error.localizedDescription }
                        }
                    }
                    if let errorMessage { Text(errorMessage).font(.caption).foregroundStyle(.red) }
                    Button("Sign out", role: .destructive) {
                        Task { await auth.signOut() }
                    }
                }

                Section("Your store") {
                    NavigationLink("Orders") { OrdersView() }
                    NavigationLink("Wishlist") { WishlistView() }
                    NavigationLink("Addresses") { AddressesView() }
                }
            } else {
                Section("Sign in") {
                    TextField("Email", text: Binding(
                        get: { auth.email },
                        set: { auth.email = $0 }
                    ))
                    #if os(iOS)
                    .textInputAutocapitalization(.never)
                    .keyboardType(.emailAddress)
                    #endif
                    SecureField("Password", text: $password)
                    Button(isLoading ? "Signing in…" : "Sign in") {
                        Task {
                            isLoading = true
                            defer { isLoading = false }
                            do {
                                try await auth.signIn(email: auth.email, password: password)
                                password = ""
                                errorMessage = nil
                            } catch {
                                errorMessage = error.localizedDescription
                            }
                        }
                    }
                    .disabled(auth.email.isEmpty || password.isEmpty || isLoading)
                    Button("Create account") { showSignUp = true }
                    if let errorMessage {
                        Text(errorMessage).font(.caption).foregroundStyle(.red)
                    }
                }
            }

            Section("Browse") {
                NavigationLink("Bundles") { BundlesView() }
                NavigationLink("Track order") { TrackOrderView() }
            }

            Section("Store") {
                LabeledContent("Phone", value: StoreConfig.phone)
                LabeledContent("Email", value: StoreConfig.supportEmail)
                LabeledContent("Hours", value: StoreConfig.hours)
                Button("Open website") { openURL(AppConfig.siteURL) }
            }
        }
        .navigationTitle("Account")
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
        .onAppear {
            editName = auth.profile?.fullName ?? ""
            editPhone = auth.profile?.phone ?? ""
        }
        .onChange(of: auth.profile?.fullName) { _, _ in
            editName = auth.profile?.fullName ?? ""
            editPhone = auth.profile?.phone ?? ""
        }
        .sheet(isPresented: $showSignUp) {
            NavigationStack { SignUpView() }
        }
        .task {
            if auth.isSignedIn {
                await WishlistStore.shared.refresh()
            }
        }
    }
}
