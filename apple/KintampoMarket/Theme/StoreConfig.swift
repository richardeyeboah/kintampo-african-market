import Foundation

enum StoreConfig {
    static let name = "Kintampo African Market"
    static let shortName = "Kintampo Market"
    static let tagline = "Groceries from Ghana & the Caribbean."
    static let address = "1668 E Dublin Granville Rd, Columbus, OH 43229"
    static let hours = "Mon–Sat 9am–8pm · Sun 10am–6pm"

    static var supportEmail: String {
        let e = AppConfig.supportEmail
        return e.isEmpty ? "kalebdoffour@gmail.com" : e
    }

    static var phone: String {
        let digits = AppConfig.storePhone.filter(\.isNumber)
        guard digits.count == 10 else { return "(614) 377-8297" }
        let a = digits.prefix(3)
        let b = digits.dropFirst(3).prefix(3)
        let c = digits.suffix(4)
        return "(\(a)) \(b)-\(c)"
    }

    static let productCategories: [String] = [
        "African Prints", "Alcohol", "Beverages", "Bread", "Brocade", "Canned",
        "Caribbean product", "Cosmetics", "Dairy And Tea", "Flours & Rice",
        "Fresh Produce", "Frozen foods", "Hair & Braiding", "Headtie", "Kente",
        "Lace", "Meat and Seafood", "Motherland", "Non food", "Ready-to-wear",
        "Snack", "Spices",
    ]
}
