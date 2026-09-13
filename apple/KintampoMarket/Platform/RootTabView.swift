import SwiftUI

/// iPhone / iPad / Mac — tab shell mirrors the mobile web bottom nav.
struct RootTabView: View {
    @Bindable private var cart = CartStore.shared

    var body: some View {
        TabView {
            NavigationStack {
                HomeView()
            }
            .tabItem { Label("Home", systemImage: "house.fill") }

            NavigationStack {
                ShopView()
            }
            .tabItem { Label("Shop", systemImage: "bag.fill") }

            NavigationStack {
                CartView()
            }
            .tabItem {
                Label("Cart", systemImage: "cart.fill")
            }
            .badge(cart.itemCount > 0 ? cart.itemCount : 0)

            NavigationStack {
                TrackOrderView()
            }
            .tabItem { Label("Track", systemImage: "shippingbox.fill") }

            NavigationStack {
                AccountView()
            }
            .tabItem { Label("Account", systemImage: "person.fill") }
        }
        .tint(Brand.red)
        .safeAreaInset(edge: .top) {
            if AppConfig.fixtureURL != nil {
                Text("TEST MODE — sample products and test payments")
                    .font(.caption).frame(maxWidth: .infinity).padding(6)
                    .background(.yellow.opacity(0.2))
            }
        }
    }
}

#if os(macOS)
/// Mac uses the same tabs; optionally switch to sidebar later.
typealias PlatformRootView = RootTabView
#elseif os(iOS)
typealias PlatformRootView = RootTabView
#endif
