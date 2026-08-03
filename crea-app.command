#!/bin/bash
#
# Crea Opuscolo.app, un'applicazione Mac autonoma che contiene già tutto il
# necessario: puoi spostarla in Applicazioni e cancellare questa cartella.
#
# Uso: doppio clic su questo file nel Finder.
#
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP="$DIR/Opuscolo.app"
RES="$APP/Contents/Resources"

for f in index.html booklet.js vendor/pdf-lib.min.js vendor/pdf.min.js vendor/pdf.worker.min.js; do
  if [ ! -f "$DIR/$f" ]; then
    echo "Errore: manca $f. Tieni questo script insieme agli altri file." >&2
    exit 1
  fi
done

echo "Creo Opuscolo.app…"
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$RES"

cp "$DIR/index.html" "$DIR/booklet.js" "$RES/"
cp -R "$DIR/vendor" "$RES/vendor"
# Il logo è facoltativo: senza, in fondo all'app resta la sola scritta.
if [ -d "$DIR/logo" ]; then
  cp -R "$DIR/logo" "$RES/logo"
fi

cat > "$APP/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>Opuscolo</string>
  <key>CFBundleDisplayName</key><string>Opuscolo</string>
  <key>CFBundleExecutable</key><string>Opuscolo</string>
  <key>CFBundleIdentifier</key><string>local.opuscolo.booklet</string>
  <key>CFBundleIconFile</key><string>icona</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>1.0</string>
  <key>CFBundleVersion</key><string>1</string>
  <key>LSMinimumSystemVersion</key><string>10.13</string>
  <key>NSHighResolutionCapable</key><true/>
</dict>
</plist>
PLIST

# L'eseguibile apre la pagina inclusa nel bundle con il browser predefinito.
cat > "$APP/Contents/MacOS/Opuscolo" <<'LAUNCH'
#!/bin/bash
HERE="$(cd "$(dirname "$0")/../Resources" && pwd)"
open "$HERE/index.html"
LAUNCH
chmod +x "$APP/Contents/MacOS/Opuscolo"

# Icona: sips e iconutil ci sono su ogni Mac, ma se mancassero l'app funziona
# lo stesso, solo con l'icona generica.
if [ -f "$DIR/icona.png" ] && command -v sips >/dev/null && command -v iconutil >/dev/null; then
  SET="$(mktemp -d)/icona.iconset"
  mkdir -p "$SET"
  for pair in "16 icon_16x16" "32 icon_16x16@2x" "32 icon_32x32" "64 icon_32x32@2x" \
              "128 icon_128x128" "256 icon_128x128@2x" "256 icon_256x256" \
              "512 icon_256x256@2x" "512 icon_512x512" "1024 icon_512x512@2x"; do
    set -- $pair
    sips -z "$1" "$1" "$DIR/icona.png" --out "$SET/$2.png" >/dev/null 2>&1
  done
  iconutil -c icns "$SET" -o "$RES/icona.icns" >/dev/null 2>&1 || echo "(icona non generata, poco male)"
  rm -rf "$(dirname "$SET")"
fi

# Senza questo macOS può bloccare l'app come "scaricata da internet".
xattr -cr "$APP" >/dev/null 2>&1 || true
touch "$APP"

echo
echo "Fatto: $APP"
echo "Trascinala nella cartella Applicazioni e aprila con un doppio clic."
echo
read -n 1 -s -r -p "Premi un tasto per chiudere questa finestra."
echo
