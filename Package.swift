// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "AsciiCardGame",
    platforms: [
        .iOS(.v16)
    ],
    products: [
        .library(
            name: "AsciiCardGame",
            targets: ["AsciiCardGame"]
        )
    ],
    targets: [
        .target(
            name: "AsciiCardGame",
            path: "AsciiCardGame"
        )
    ]
)
