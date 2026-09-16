#!/bin/sh
# Double-click helper for the unsigned AllSearch DMG.
# Clears the quarantine flag macOS puts on browser downloads,
# then opens the app. Run AFTER dragging AllSearch to Applications.
set -u
APP="/Applications/AllSearch.app"
if [ ! -d "$APP" ]; then
  osascript -e 'display alert "AllSearch not found" message "Drag AllSearch to the Applications folder first, then run this again." as critical'
  exit 1
fi
xattr -cr "$APP"
open "$APP"
