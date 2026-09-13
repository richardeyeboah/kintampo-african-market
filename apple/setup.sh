#!/bin/bash
# Generates KintampoMarket.xcodeproj when XcodeGen is installed.
set -euo pipefail
cd "$(dirname "$0")"

if [[ ! -f Config.xcconfig ]]; then
  cp Config.example.xcconfig Config.xcconfig
  echo "Created Config.xcconfig — add your Supabase keys from ../.env.local"
fi

if command -v xcodegen >/dev/null 2>&1; then
  xcodegen generate
  echo "Done. Open KintampoMarket.xcodeproj in Xcode."
else
  cat <<'EOF'

XcodeGen not found. Either:

  1. Install: brew install xcodegen
     Then re-run: ./setup.sh

  2. Manual (one-time in Xcode):
     File → New → Project → Multiplatform → App
     Product name: KintampoMarket
     Save inside: apple/
     Delete the template Swift files, then drag the KintampoMarket/ folder into the project.
     Add a watchOS App target (File → New → Target → Watch App).
     Project → Info → Configurations → set Debug/Release to Config.xcconfig
     Copy keys from Config.xcconfig into Build Settings or Info.plist user-defined keys.

Your Next.js web app in the repo root is untouched.

EOF
fi
