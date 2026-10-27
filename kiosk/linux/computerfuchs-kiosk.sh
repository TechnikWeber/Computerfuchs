#!/usr/bin/env bash
#
# Computerfuchs als Kiosk unter Linux – mit Cage, auch auf dem Raspberry Pi.
#
#   sudo bash computerfuchs-kiosk.sh           einrichten
#   sudo bash computerfuchs-kiosk.sh --help    alle Möglichkeiten
#
# Danach meldet sich beim Start das Konto „kind“ automatisch an, und Cage
# zeigt nur Chromium mit Computerfuchs – ohne Desktop, ohne Adressleiste,
# ohne Ausweg. Stürzt etwas ab, startet es neu.
#
# Gemacht für Debian 12/13 und Raspberry Pi OS (Bookworm und neuer).
# NOCH NICHT AUF ECHTER HARDWARE GETESTET – Rückmeldungen bitte an
# https://github.com/TechnikWeber/Computerfuchs/issues
#
# Anleitung: docs/KIOSK.md

set -euo pipefail

SCRIPT_VERSION=0.2.0
KIOSK_USER=kind
URL='https://technikweber.github.io/Computerfuchs/?kiosk'
ALLOW_VT=0
WITH_SSH=0
WITH_UPDATES=1
OUTPUT_MODE=extend
DESKTOP_ACTION=ask
USE_POLICIES=1
UNINSTALL=0
REMOVE_USER=0
FORCE=0

CONF=/etc/computerfuchs-kiosk.conf
SESSION=/usr/local/bin/computerfuchs-kiosk-session
GETTY_DROPIN=/etc/systemd/system/getty@tty1.service.d/computerfuchs-autologin.conf
WAYLAND_SESSION=/usr/share/wayland-sessions/computerfuchs.desktop
POLICY_DIRS=(/etc/chromium/policies/managed /etc/chromium-browser/policies/managed)
POLICY_NAME=computerfuchs.json
MARK_BEGIN='# >>> computerfuchs-kiosk >>>'
MARK_END='# <<< computerfuchs-kiosk <<<'

say() { printf '\n\033[1;33m→ %s\033[0m\n' "$*"; }
note() { printf '  %s\n' "$*"; }
die() { printf '\n\033[1;31mFehler: %s\033[0m\n' "$*" >&2; exit 1; }

usage() {
  cat <<'EOF'
Computerfuchs als Kiosk (Linux mit Cage)

  sudo bash computerfuchs-kiosk.sh [Optionen]

Optionen:
  --user NAME      Name des Kinderkontos (Standard: kind)
  --url ADRESSE    Andere Adresse, z. B. ein eigener Server
                   (Standard: https://technikweber.github.io/Computerfuchs/?kiosk)
  --ssh            SSH einschalten – zum Warten von einem anderen Rechner aus
  --vt             Wechsel auf andere Konsolen erlauben (Strg+Alt+F2 …)
  --last-screen    Bei zwei Bildschirmen nur den zuletzt angeschlossenen nutzen
  --no-updates     Keine automatischen Sicherheitsupdates einrichten
  --no-desktop     Ein vorhandener Desktop startet nicht mehr; der Rechner
                   wird ganz zum Lerncomputer (rückgängig mit --uninstall)
  --session        Desktop behalten: Computerfuchs nur als Sitzung am
                   Anmeldebildschirm anbieten (ohne automatische Anmeldung)
  --no-policies    Keine Chromium-Sperren setzen (siehe Anleitung)
  --uninstall      Alles wieder entfernen (das Konto bleibt)
  --remove-user    Mit --uninstall: auch das Konto samt Spielständen löschen
  --force          Auch auf nicht unterstützten Systemen weitermachen
  -h, --help       Diese Hilfe

Anleitung: https://github.com/TechnikWeber/Computerfuchs/blob/main/docs/KIOSK.md
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --user) KIOSK_USER=${2:?--user braucht einen Namen}; shift 2 ;;
    --user=*) KIOSK_USER=${1#*=}; shift ;;
    --url) URL=${2:?--url braucht eine Adresse}; shift 2 ;;
    --url=*) URL=${1#*=}; shift ;;
    --ssh) WITH_SSH=1; shift ;;
    --vt) ALLOW_VT=1; shift ;;
    --last-screen) OUTPUT_MODE=last; shift ;;
    --no-updates) WITH_UPDATES=0; shift ;;
    --no-desktop) DESKTOP_ACTION=disable; shift ;;
    --session) DESKTOP_ACTION=session; shift ;;
    --no-policies) USE_POLICIES=0; shift ;;
    --uninstall) UNINSTALL=1; shift ;;
    --remove-user) REMOVE_USER=1; shift ;;
    --force) FORCE=1; shift ;;
    -h | --help) usage; exit 0 ;;
    *) usage >&2; die "Unbekannte Option: $1" ;;
  esac
done

[ "$(id -u)" -eq 0 ] || die "Bitte mit sudo starten: sudo bash $0"
[[ $KIOSK_USER =~ ^[a-z_][a-z0-9_-]{0,31}$ ]] || die "Ungültiger Kontoname: $KIOSK_USER"
case "$URL" in
  http://* | https://*) ;;
  *) die "Die Adresse muss mit http:// oder https:// anfangen: $URL" ;;
esac
case "$URL" in
  *[[:space:]\'\"\\]*) die "Die Adresse darf keine Leerzeichen, Anführungszeichen oder Backslashes enthalten: $URL" ;;
esac

# ---------------------------------------------------------------------------
# Hilfsfunktionen
# ---------------------------------------------------------------------------

home_of() { getent passwd "$1" | cut -d: -f6; }

# Teil der Adresse ohne ?… und #… – das darf Chromium öffnen.
allow_prefix() {
  local u=${1%%#*}
  u=${u%%\?*}
  printf '%s' "$u"
}

# Erstes Paket aus der Liste, das es in den Paketquellen gibt.
pick_pkg() {
  local p
  for p in "$@"; do
    if apt-cache show "$p" >/dev/null 2>&1; then
      printf '%s' "$p"
      return 0
    fi
  done
  return 1
}

remove_marked_block() {
  local file=$1
  [ -f "$file" ] || return 0
  sed -i "/^$MARK_BEGIN\$/,/^$MARK_END\$/d" "$file"
}

# Läuft ein Desktop mit Anmeldebildschirm (GDM, LightDM, SDDM …)?
desktop_active() {
  [ "$(systemctl get-default 2>/dev/null)" = graphical.target ] && [ -e /etc/systemd/system/display-manager.service ]
}

# ---------------------------------------------------------------------------
# Entfernen
# ---------------------------------------------------------------------------

if [ "$UNINSTALL" -eq 1 ]; then
  say "Computerfuchs-Kiosk wird entfernt"
  # shellcheck disable=SC1090
  [ -r "$CONF" ] && . "$CONF"
  rm -f "$GETTY_DROPIN"
  rmdir --ignore-fail-on-non-empty "$(dirname "$GETTY_DROPIN")" 2>/dev/null || true
  rm -f "$SESSION" "$WAYLAND_SESSION" /etc/apt/apt.conf.d/52computerfuchs-kiosk
  for dir in "${POLICY_DIRS[@]}"; do rm -f "$dir/$POLICY_NAME"; done
  if [ -n "${DESKTOP_WAS:-}" ]; then
    note "Desktop wird wieder eingeschaltet ($DESKTOP_WAS)"
    systemctl set-default "$DESKTOP_WAS" >/dev/null
  fi
  if id "$KIOSK_USER" >/dev/null 2>&1; then
    home=$(home_of "$KIOSK_USER")
    remove_marked_block "$home/.bash_profile"
    if [ -f "/var/lib/AccountsService/users/$KIOSK_USER" ] && grep -q '^Session=computerfuchs$' "/var/lib/AccountsService/users/$KIOSK_USER"; then
      sed -i '/^Session=computerfuchs$/d' "/var/lib/AccountsService/users/$KIOSK_USER"
    fi
    if [ "$REMOVE_USER" -eq 1 ]; then
      note "Konto $KIOSK_USER wird gelöscht – mit allen Spielständen"
      pkill -u "$KIOSK_USER" 2>/dev/null || true
      sleep 1
      userdel --remove "$KIOSK_USER" 2>/dev/null || userdel "$KIOSK_USER"
    fi
  fi
  rm -f "$CONF"
  systemctl daemon-reload
  say "Fertig. Installierte Pakete (cage, chromium …) sind noch da – entfernen mit apt, falls gewünscht."
  exit 0
fi

# ---------------------------------------------------------------------------
# Prüfen
# ---------------------------------------------------------------------------

command -v apt-get >/dev/null || die "Dieses Skript braucht Debian, Raspberry Pi OS oder ein verwandtes System mit apt."
# shellcheck disable=SC1091
. /etc/os-release
IS_PI=0
if grep -qi 'raspberry pi' /proc/device-tree/model 2>/dev/null; then IS_PI=1; fi

say "Computerfuchs-Kiosk $SCRIPT_VERSION auf ${PRETTY_NAME:-Linux}$([ "$IS_PI" -eq 1 ] && printf ' (Raspberry Pi)')"
note "Kinderkonto: $KIOSK_USER"
note "Adresse:     $URL"

if [ "${ID:-}" = ubuntu ] && [ "$FORCE" -eq 0 ]; then
  die "Ubuntu liefert Chromium nur als Snap. Ob die Sperren dort greifen, ist nicht geprüft.
       Empfohlen: Debian oder Raspberry Pi OS. Trotzdem versuchen: --force"
fi

if id "$KIOSK_USER" >/dev/null 2>&1; then
  if id -nG "$KIOSK_USER" | tr ' ' '\n' | grep -qxE 'sudo|wheel|adm'; then
    die "Das Konto $KIOSK_USER hat Verwaltungsrechte. Für den Kiosk bitte ein eigenes Kinderkonto nehmen (--user)."
  fi
fi

if desktop_active && [ "$DESKTOP_ACTION" = ask ]; then
  dm=$(basename "$(readlink -f /etc/systemd/system/display-manager.service)" .service)
  die "Auf diesem Rechner läuft eine Desktop-Oberfläche ($dm). Zwei Möglichkeiten:
       --no-desktop  Der Rechner wird ganz zum Lerncomputer (empfohlen für ein eigenes Gerät).
       --session     Desktop bleibt; Computerfuchs erscheint als Sitzung am Anmeldebildschirm.
                     Achtung: Die Chromium-Sperren gelten dann für alle Konten – Erwachsene
                     nehmen besser einen anderen Browser (oder --no-policies)."
fi
if ! desktop_active && [ "$DESKTOP_ACTION" = session ]; then
  die "--session braucht einen Desktop mit Anmeldebildschirm. Ohne Desktop einfach ohne --session starten."
fi

# ---------------------------------------------------------------------------
# Pakete
# ---------------------------------------------------------------------------

say "Pakete werden installiert (das dauert ein paar Minuten)"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
# Auf dem Raspberry Pi zuerst dessen eigenes Chromium (mit Hardware-Beschleunigung).
if [ "$IS_PI" -eq 1 ]; then
  CHROMIUM_PKG=$(pick_pkg chromium-browser chromium) || die "In den Paketquellen gibt es kein Chromium."
else
  CHROMIUM_PKG=$(pick_pkg chromium chromium-browser) || die "In den Paketquellen gibt es kein Chromium."
fi
packages=(cage "$CHROMIUM_PKG" iproute2)
# Ton: PipeWire. Sprache: Speech Dispatcher mit eSpeak NG (kann Deutsch).
if p=$(pick_pkg pipewire-audio); then packages+=("$p"); else packages+=(pipewire pipewire-pulse wireplumber); fi
for p in speech-dispatcher speech-dispatcher-espeak-ng espeak-ng; do
  if pick_pkg "$p" >/dev/null; then packages+=("$p"); fi
done
[ "$WITH_UPDATES" -eq 1 ] && packages+=(unattended-upgrades)
if [ "$WITH_SSH" -eq 1 ]; then
  packages+=(openssh-server)
  # Damit „ssh eltern@computerfuchs.local“ klappt
  if pick_pkg avahi-daemon >/dev/null; then packages+=(avahi-daemon); fi
fi
note "${packages[*]}"
apt-get install -y -qq "${packages[@]}" >/dev/null

if [ "$WITH_UPDATES" -eq 1 ]; then
  # Der Browser ist immer offen – Sicherheitsupdates sollen von selbst kommen.
  printf 'APT::Periodic::Update-Package-Lists "1";\nAPT::Periodic::Unattended-Upgrade "1";\n' >/etc/apt/apt.conf.d/20auto-upgrades
  if [ "$IS_PI" -eq 1 ]; then
    # Chromium kommt auf dem Pi aus dessen eigener Paketquelle – die soll auch aktualisiert werden.
    cat >/etc/apt/apt.conf.d/52computerfuchs-kiosk <<'UPD'
// Computerfuchs-Kiosk: auch Updates aus der Raspberry-Pi-Paketquelle (Chromium) einspielen
Unattended-Upgrade::Origins-Pattern {
  "origin=Raspberry Pi Foundation,codename=${distro_codename}";
};
UPD
  fi
  note "Automatische Sicherheitsupdates sind an."
fi
if [ "$WITH_SSH" -eq 1 ]; then
  systemctl enable --now ssh >/dev/null 2>&1 || systemctl enable --now sshd >/dev/null 2>&1 || true
  note "SSH ist an."
fi

# ---------------------------------------------------------------------------
# Kinderkonto
# ---------------------------------------------------------------------------

say "Kinderkonto „$KIOSK_USER“"
if ! id "$KIOSK_USER" >/dev/null 2>&1; then
  useradd --create-home --shell /bin/bash --comment "Computerfuchs" "$KIOSK_USER"
  note "angelegt"
fi
# Ohne Passwort, gesperrt: Anmelden geht nur automatisch am Bildschirm, nicht per SSH.
passwd --lock "$KIOSK_USER" >/dev/null
for g in audio video render input; do
  if getent group "$g" >/dev/null; then usermod -aG "$g" "$KIOSK_USER"; fi
done
HOME_DIR=$(home_of "$KIOSK_USER")
install -d -o "$KIOSK_USER" -g "$KIOSK_USER" "$HOME_DIR/Computerfuchs"

# ---------------------------------------------------------------------------
# Einstellungen und Startskript
# ---------------------------------------------------------------------------

say "Startskript für Cage und Chromium"
CAGE_ARGS="-d -m $OUTPUT_MODE"
[ "$ALLOW_VT" -eq 1 ] && CAGE_ARGS="$CAGE_ARGS -s"
DESKTOP_WAS_OLD=''
if [ -r "$CONF" ]; then
  DESKTOP_WAS_OLD=$(sed -n "s/^DESKTOP_WAS=//p" "$CONF" | tr -d "'\"")
fi
{
  printf '# Computerfuchs-Kiosk – erzeugt von computerfuchs-kiosk.sh %s\n' "$SCRIPT_VERSION"
  printf '# Nach Änderungen neu starten (sudo reboot).\n'
  printf 'URL=%q\n' "$URL"
  printf 'CAGE_ARGS=%q\n' "$CAGE_ARGS"
  [ -n "$DESKTOP_WAS_OLD" ] && printf 'DESKTOP_WAS=%q\n' "$DESKTOP_WAS_OLD"
} >"$CONF"

cat >"$SESSION" <<'EOF'
#!/bin/bash
# Computerfuchs-Kiosk: Chromium im Vollbild in Cage. Geht etwas zu, startet es neu.
# Erzeugt von computerfuchs-kiosk.sh – Einstellungen stehen in /etc/computerfuchs-kiosk.conf.
set -u
URL='https://technikweber.github.io/Computerfuchs/?kiosk'
CAGE_ARGS='-d'
# shellcheck disable=SC1091
[ -r /etc/computerfuchs-kiosk.conf ] && . /etc/computerfuchs-kiosk.conf

# Tastatur wie im System eingestellt – fürs Tastatur-Training am besten Deutsch (QWERTZ).
# shellcheck disable=SC1091
[ -r /etc/default/keyboard ] && . /etc/default/keyboard
export XKB_DEFAULT_LAYOUT="${XKBLAYOUT:-de}"
export XKB_DEFAULT_VARIANT="${XKBVARIANT:-}"
export XKB_DEFAULT_MODEL="${XKBMODEL:-pc105}"
export XKB_DEFAULT_OPTIONS="${XKBOPTIONS:-}"

BROWSER=$(command -v chromium || command -v chromium-browser || true)
LOG="$HOME/.cache/computerfuchs-kiosk.log"
mkdir -p "$HOME/.cache"
# Das Protokoll klein halten
if [ -f "$LOG" ] && [ "$(stat -c %s "$LOG")" -gt 1000000 ]; then mv -f "$LOG" "$LOG.1"; fi
if [ -z "$BROWSER" ]; then
  echo "$(date) Chromium fehlt" >>"$LOG"
  sleep 30
  exit 1
fi

# Kurz aufs Netz warten. Computerfuchs startet aber auch ohne: Nach dem
# ersten Besuch liegt er im Offline-Speicher des Browsers.
for _ in $(seq 1 15); do
  ip route 2>/dev/null | grep -q '^default' && break
  sleep 1
done

while true; do
  # Nach einem Stromausfall keine „Wiederherstellen?“-Frage
  for prefs in "$HOME/.config/chromium/Default/Preferences" "$HOME/.config/chromium-browser/Default/Preferences"; do
    [ -f "$prefs" ] && sed -i 's/"exited_cleanly":false/"exited_cleanly":true/; s/"exit_type":"[^"]*"/"exit_type":"Normal"/' "$prefs"
  done
  echo "$(date) Start: $BROWSER $URL" >>"$LOG"
  # shellcheck disable=SC2086 # CAGE_ARGS sind mehrere Optionen
  cage $CAGE_ARGS -- "$BROWSER" \
    --kiosk \
    --ozone-platform=wayland \
    --noerrdialogs \
    --disable-infobars \
    --no-first-run \
    --password-store=basic \
    --enable-speech-dispatcher \
    --autoplay-policy=no-user-gesture-required \
    --overscroll-history-navigation=0 \
    --disable-pinch \
    --check-for-update-interval=31536000 \
    --no-default-browser-check \
    --disable-features=Translate \
    "$URL" >>"$LOG" 2>&1
  rc=$?
  echo "$(date) Ende (Code $rc)" >>"$LOG"
  sleep 2
done
EOF
chmod 755 "$SESSION"

# ---------------------------------------------------------------------------
# Chromium-Sperren
# ---------------------------------------------------------------------------

if [ "$USE_POLICIES" -eq 1 ]; then
  say "Chromium-Sperren: nur Computerfuchs, keine Entwicklerwerkzeuge, kein Inkognito"
  ALLOW=$(allow_prefix "$URL")
  for dir in "${POLICY_DIRS[@]}"; do
    install -d "$dir"
    cat >"$dir/$POLICY_NAME" <<EOF
{
  "URLBlocklist": ["*"],
  "URLAllowlist": ["$ALLOW"],
  "DeveloperToolsAvailability": 2,
  "IncognitoModeAvailability": 1,
  "BrowserSignin": 0,
  "SyncDisabled": true,
  "PasswordManagerEnabled": false,
  "AutofillAddressEnabled": false,
  "AutofillCreditCardEnabled": false,
  "TranslateEnabled": false,
  "PrintingEnabled": false,
  "BrowserGuestModeEnabled": false,
  "BrowserAddPersonEnabled": false,
  "DefaultBrowserSettingEnabled": false,
  "MetricsReportingEnabled": false,
  "BackgroundModeEnabled": false,
  "PromptForDownloadLocation": false,
  "DownloadDirectory": "\${user_home}/Computerfuchs"
}
EOF
  done
else
  for dir in "${POLICY_DIRS[@]}"; do rm -f "$dir/$POLICY_NAME"; done
  note "Keine Chromium-Sperren (--no-policies)."
fi

# ---------------------------------------------------------------------------
# Start: automatisch auf dem ersten Bildschirm – oder als Sitzung am Desktop
# ---------------------------------------------------------------------------

if [ "$DESKTOP_ACTION" = session ]; then
  say "Computerfuchs als Sitzung am Anmeldebildschirm"
  # Falls vorher die automatische Anmeldung eingerichtet war: weg damit.
  rm -f "$GETTY_DROPIN"
  remove_marked_block "$HOME_DIR/.bash_profile"
  install -d "$(dirname "$WAYLAND_SESSION")"
  cat >"$WAYLAND_SESSION" <<EOF
[Desktop Entry]
Name=Computerfuchs
Comment=Lerncomputer für Kinder im Vollbild
Exec=$SESSION
Type=Application
DesktopNames=Computerfuchs
EOF
  if [ -d /var/lib/AccountsService/users ]; then
    f="/var/lib/AccountsService/users/$KIOSK_USER"
    [ -f "$f" ] || printf '[User]\n' >"$f"
    sed -i '/^Session=/d' "$f"
    printf 'Session=computerfuchs\n' >>"$f"
  fi
  printf '[Desktop]\nSession=computerfuchs\n' >"$HOME_DIR/.dmrc"
  chown "$KIOSK_USER:$KIOSK_USER" "$HOME_DIR/.dmrc"
  note "Am Anmeldebildschirm „$KIOSK_USER“ wählen – die Sitzung „Computerfuchs“ ist voreingestellt."
  note "Automatisch anmelden lässt sich das Konto in den Benutzer-Einstellungen des Desktops."
else
  if [ "$DESKTOP_ACTION" = disable ] && desktop_active; then
    say "Desktop wird ausgeschaltet (rückgängig mit --uninstall)"
    if ! grep -q '^DESKTOP_WAS=' "$CONF"; then printf 'DESKTOP_WAS=%q\n' "$(systemctl get-default)" >>"$CONF"; fi
    systemctl set-default multi-user.target >/dev/null
  fi

  say "Automatische Anmeldung auf dem ersten Bildschirm"
  rm -f "$WAYLAND_SESSION"
  install -d "$(dirname "$GETTY_DROPIN")"
  cat >"$GETTY_DROPIN" <<EOF
# Computerfuchs-Kiosk: $KIOSK_USER meldet sich auf tty1 automatisch an.
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin $KIOSK_USER --noclear %I \$TERM
EOF

  profile="$HOME_DIR/.bash_profile"
  if [ ! -f "$profile" ]; then
    printf '# ~/.bash_profile\n[ -f ~/.profile ] && . ~/.profile\n' >"$profile"
  fi
  remove_marked_block "$profile"
  cat >>"$profile" <<EOF
$MARK_BEGIN
# Auf dem ersten Bildschirm startet Computerfuchs – nicht über SSH.
if [ -z "\${WAYLAND_DISPLAY:-}" ] && [ "\$(tty)" = /dev/tty1 ]; then
  exec $SESSION
fi
$MARK_END
EOF
  chown "$KIOSK_USER:$KIOSK_USER" "$profile"
  systemctl daemon-reload
fi

# ---------------------------------------------------------------------------

say "Fertig!"
if [ "$DESKTOP_ACTION" = session ]; then
  note "Abmelden und am Anmeldebildschirm „$KIOSK_USER“ mit der Sitzung „Computerfuchs“ wählen."
else
  note "Jetzt neu starten: sudo reboot"
  note "Danach startet Computerfuchs von selbst."
fi
note "Ausschalten: kurz auf den Power-Knopf drücken."
if [ "$WITH_SSH" -eq 1 ]; then note "Warten: per SSH mit deinem Eltern-Konto."; fi
if [ "$ALLOW_VT" -eq 1 ]; then note "Warten: Strg+Alt+F2 wechselt zu einer Text-Anmeldung."; fi
if [ "$WITH_SSH" -eq 0 ] && [ "$ALLOW_VT" -eq 0 ] && [ "$DESKTOP_ACTION" != session ] &&
  ! systemctl is-enabled ssh >/dev/null 2>&1 && ! systemctl is-enabled sshd >/dev/null 2>&1; then
  printf '\n\033[1;31m  Achtung: Ohne --ssh oder --vt kommst du später nur noch mit einem\n'
  printf '  USB-Stick an diesen Rechner heran. Am besten noch einmal mit --ssh starten.\033[0m\n'
fi
note "Protokoll: $HOME_DIR/.cache/computerfuchs-kiosk.log"
note "Rückgängig: sudo bash $0 --uninstall"
