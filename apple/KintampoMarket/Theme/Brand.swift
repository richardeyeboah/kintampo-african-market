import SwiftUI

enum Brand {
    static let red = Color(hex: 0xCE1126)
    static let redDark = Color(hex: 0xAD0E20)
    static let gold = Color(hex: 0xF59E0B)
    static let surface = Color(hex: 0xFAFAF9)
    static let ink = Color(hex: 0x1C1917)
}

extension Color {
    init(hex: UInt32, alpha: Double = 1) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: alpha
        )
    }
}
