import Foundation
import Observation

@Observable
@MainActor
final class OrderTrackViewModel {
    var orderID = ""
    var email = ""
    var order: TrackedOrder?
    var errorMessage: String?
    var isLoading = false

    func track() async {
        errorMessage = nil
        order = nil
        isLoading = true
        defer { isLoading = false }

        do {
            order = try await APIClient.shared.trackOrder(id: orderID, email: email)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
