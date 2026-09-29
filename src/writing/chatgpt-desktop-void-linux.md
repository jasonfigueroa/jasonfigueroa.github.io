---
layout: article.njk
title: Installing the Official ChatGPT Desktop App on Void Linux
description: A user-local installation with XFCE integration, secure credential storage, and an updater with rollback.
date: 2026-09-29
tags: article
category: Linux / Developer tools
permalink: /writing/chatgpt-desktop-void-linux/
---
This guide documents a working installation of the **official OpenAI ChatGPT Linux desktop app** on a fresh **Void Linux** system using **XFCE**.

The approach is intentionally conservative:

- use OpenAI's official Linux `.deb`
- do not install or convert it system-wide
- extract it into your home directory
- keep the installation easy to remove
- integrate it with XFCE manually
- use GNOME Keyring for secure credential storage
- update it later with a small user-local updater script

> Void Linux is not on OpenAI’s [officially supported distribution list](https://learn.chatgpt.com/docs/linux/linux-app). These are the steps I used on my own system, using OpenAI’s application package.

## Tested setup

This procedure was tested with:

```text
Architecture: x86_64
C library:    glibc 2.41
Desktop:      XFCE
Login manager: LightDM
```

Check your own system first:

```bash
uname -m
ldd --version 2>&1 | head -n 1
```

You want something like:

```text
x86_64
ldd (GNU libc) ...
```

> This guide is for **glibc Void Linux**. A Void `musl` installation may need a different approach, such as running ChatGPT inside a glibc-based container or Distrobox environment.

---

## 1. Install the required tools

Check for the tools used below:

```bash
command -v curl
command -v ar
command -v tar
```

Install anything missing:

```bash
sudo xbps-install -S curl binutils xz file desktop-file-utils
```

The `file` utility is used to inspect the executables, and `desktop-file-utils` provides `update-desktop-database` for the application-menu entry.

You will also want `xdg-utils` so ChatGPT can open your browser for login:

```bash
sudo xbps-install -S xdg-utils
```

Verify:

```bash
command -v xdg-open
```

Expected:

```text
/usr/bin/xdg-open
```

### Install bubblewrap for sandboxed commands

Install Void's `bubblewrap` package:

```bash
sudo xbps-install -S bubblewrap
```

Bubblewrap is an independent, open-source Linux sandboxing tool. The ChatGPT desktop app's local agent uses its `bwrap` executable to run shell commands within the configured filesystem and network restrictions. Extracting the `.deb` manually does not install this system dependency. The app may open normally while agent shell commands fail with a `bubblewrap is unavailable` error if neither a system executable nor a usable bundled helper is available. OpenAI recommends installing the distribution package; see the [official sandbox documentation](https://learn.chatgpt.com/docs/sandboxing).

Verify the executable is available:

```bash
command -v bwrap
bwrap --version
```

On Void, `command -v bwrap` should report `/usr/bin/bwrap`. If ChatGPT was already running, retry the failed command; if it still reports bubblewrap missing, fully quit and reopen the app.

---

## 2. Download the official ChatGPT Linux package

Create a temporary working directory:

```bash
mkdir -p ~/Downloads/chatgpt-void-test
cd ~/Downloads/chatgpt-void-test
```

Download OpenAI's current x86-64 Linux `.deb`:

```bash
curl --proto '=https' --tlsv1.2 -fL \
  -o chatgpt_amd64.deb \
  https://persistent.oaistatic.com/codex-app-prod/linux/deb/latest/chatgpt_amd64.deb
```

Check the download:

```bash
ls -lh chatgpt_amd64.deb
```

---

## 3. Inspect and extract the Debian package

A `.deb` is an `ar` archive.

List its contents:

```bash
ar t chatgpt_amd64.deb
```

You should see entries resembling:

```text
debian-binary
control.tar.xz
data.tar.xz
```

Extract the outer package:

```bash
mkdir deb
cd deb
ar x ../chatgpt_amd64.deb
```

Now create the user-local application directory:

```bash
mkdir -p ~/.local/opt/chatgpt
```

Extract the application payload:

```bash
tar -xJf data.tar.xz -C ~/.local/opt/chatgpt
```

If `tar` reports:

```text
xz: Cannot exec: No such file or directory
```

install `xz`:

```bash
sudo xbps-install -S xz
```

and rerun the extraction command.

---

## 4. Verify the application files

The main application should be here:

```text
~/.local/opt/chatgpt/usr/lib/chatgpt/ChatGPT
```

The launcher should be here:

```text
~/.local/opt/chatgpt/usr/lib/chatgpt/codex-launcher
```

Check:

```bash
file ~/.local/opt/chatgpt/usr/lib/chatgpt/ChatGPT
file ~/.local/opt/chatgpt/usr/lib/chatgpt/codex-launcher
```

The main executable should be an x86-64 ELF binary and `codex-launcher` should be a shell script.

Check for missing shared libraries:

```bash
ldd ~/.local/opt/chatgpt/usr/lib/chatgpt/ChatGPT | grep 'not found'
```

If this prints nothing, that is a very good sign.

The launcher itself is a shell script, so:

```bash
ldd ~/.local/opt/chatgpt/usr/lib/chatgpt/codex-launcher
```

will normally report:

```text
not a dynamic executable
```

That is expected.

You can inspect the launcher:

```bash
cat ~/.local/opt/chatgpt/usr/lib/chatgpt/codex-launcher
```

At the time this guide was written it was:

```sh
#!/bin/sh
exec "$(dirname "$(readlink -f "$0")")/ChatGPT" "$@"
```

Because it resolves the application relative to its own location, it works fine from a user-local install.

---

## 5. Launch ChatGPT for the first time

Run:

```bash
~/.local/opt/chatgpt/usr/bin/chatgpt
```

Do **not** use `sudo`.

If the application opens, the core installation is working.

---

## 6. Configure GNOME Keyring

On XFCE, ChatGPT may display a dialog such as:

```text
Choose password for new keyring
```

This is not asking for your ChatGPT password.

It is GNOME Keyring, which applications can use to store local secrets such as authentication tokens securely.

Check whether GNOME Keyring is installed:

```bash
xbps-query -l | grep gnome-keyring
```

If it is missing:

```bash
sudo xbps-install -S gnome-keyring
```

### Optional: integrate GNOME Keyring with LightDM

On a fresh Void/XFCE installation, LightDM may not automatically unlock GNOME Keyring.

First inspect:

```bash
cat /etc/pam.d/lightdm
cat /etc/pam.d/passwd
ls -l /usr/lib/security/pam_gnome_keyring.so
```

Before changing PAM, make backups:

```bash
sudo cp /etc/pam.d/lightdm /etc/pam.d/lightdm.before-keyring
sudo cp /etc/pam.d/passwd /etc/pam.d/passwd.before-keyring
```

Edit LightDM:

```bash
sudo nano /etc/pam.d/lightdm
```

Add these lines in the corresponding sections:

```text
auth      optional pam_gnome_keyring.so
password  optional pam_gnome_keyring.so
session   optional pam_gnome_keyring.so auto_start
```

For reference, my configuration looked like this. Add the keyring lines to your existing configuration; do not replace your PAM file wholesale with this example:

```text
#%PAM-1.0

# Block login if they are globally disabled
auth      required pam_nologin.so

# Load environment from /etc/environment and ~/.pam_environment
auth      required pam_env.so

# Use /etc/passwd and /etc/shadow for passwords
auth      required pam_unix.so
auth      optional pam_gnome_keyring.so

# Check account is active, change password if required
account   required pam_unix.so

# Allow password to be changed
password  required pam_unix.so
password  optional pam_gnome_keyring.so

# Setup session
session   required pam_unix.so
-session optional pam_turnstile.so
-session optional pam_elogind.so
-session optional pam_systemd.so

session   optional pam_limits.so
session   optional pam_gnome_keyring.so auto_start
```

Now edit:

```bash
sudo nano /etc/pam.d/passwd
```

Change:

```text
password required pam_unix.so sha512 shadow nullok
```

to:

```text
password required pam_unix.so sha512 shadow nullok
password optional pam_gnome_keyring.so
```

Verify:

```bash
grep -n "gnome_keyring" /etc/pam.d/lightdm /etc/pam.d/passwd
```

Then log out of XFCE and log back in normally.

### Verify D-Bus activation

Check the session bus:

```bash
echo "$DBUS_SESSION_BUS_ADDRESS"
```

Check the Secret Service entry:

```bash
ls -l /usr/share/dbus-1/services/*secret* 2>/dev/null
```

Then trigger the secret service:

```bash
dbus-send \
  --session \
  --dest=org.freedesktop.secrets \
  --type=method_call \
  --print-reply \
  /org/freedesktop/secrets \
  org.freedesktop.DBus.Peer.Ping
```

Check that GNOME Keyring started:

```bash
pgrep -f -a gnome-keyring-daemon
```

A working result may look similar to:

```text
/usr/bin/gnome-keyring-daemon --start --foreground --components=secrets
```

Launch ChatGPT again:

```bash
~/.local/opt/chatgpt/usr/bin/chatgpt
```

If prompted to create a keyring:

- use the same password as your normal Linux login password
- check the option resembling:

```text
Automatically unlock this keyring whenever I'm logged in
```

---

## 7. Fix browser login

If clicking **Log in** inside ChatGPT does nothing, make sure `xdg-open` exists:

```bash
command -v xdg-open
```

If it does not:

```bash
sudo xbps-install -S xdg-utils
```

Test:

```bash
xdg-open https://chatgpt.com
```

If that opens your normal browser, restart ChatGPT and try **Log in** again.

You can also inspect the configured default browser:

```bash
xdg-settings get default-web-browser
```

---

## 8. Add `~/.local/bin` to PATH

Create the directory:

```bash
mkdir -p ~/.local/bin
```

Add it to your user PATH:

```bash
printf '\nexport PATH="$HOME/.local/bin:$PATH"\n' >> ~/.profile
```

Apply it to the current shell:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Verify:

```bash
echo "$PATH" | tr ':' '\n' | grep "$HOME/.local/bin"
```

Create the ChatGPT command:

```bash
ln -sf \
  ~/.local/opt/chatgpt/usr/lib/chatgpt/codex-launcher \
  ~/.local/bin/chatgpt
```

Verify:

```bash
command -v chatgpt
```

Expected:

```text
/home/YOUR_USERNAME/.local/bin/chatgpt
```

Now you can launch ChatGPT with:

```bash
chatgpt
```

---

## 9. Install the XFCE application-menu entry

Create the local application directory:

```bash
mkdir -p ~/.local/share/applications
```

Copy OpenAI's desktop entry:

```bash
cp \
  ~/.local/opt/chatgpt/usr/share/applications/chatgpt.desktop \
  ~/.local/share/applications/chatgpt.desktop
```

Refresh the desktop database:

```bash
update-desktop-database ~/.local/share/applications
```

Register the `codex:` URL handler:

```bash
xdg-mime default chatgpt.desktop x-scheme-handler/codex
```

Verify:

```bash
xdg-mime query default x-scheme-handler/codex
```

Expected:

```text
chatgpt.desktop
```

---

## 10. Fix the missing XFCE menu icon

The application may appear in XFCE's menu without an icon.

Locate OpenAI's supplied icon:

```bash
find ~/.local/opt/chatgpt/usr/share \
  -type f \
  \( -iname 'chatgpt*.png' -o -iname 'chatgpt*.svg' \) \
  -print
```

Create a user-local pixmaps directory:

```bash
mkdir -p ~/.local/share/pixmaps
```

If the package contains:

```text
~/.local/opt/chatgpt/usr/share/pixmaps/chatgpt.png
```

copy it:

```bash
cp \
  ~/.local/opt/chatgpt/usr/share/pixmaps/chatgpt.png \
  ~/.local/share/pixmaps/chatgpt.png
```

Now edit:

```bash
nano ~/.local/share/applications/chatgpt.desktop
```

Change:

```text
Icon=chatgpt
```

to an absolute path, for example:

```text
Icon=/home/YOUR_USERNAME/.local/share/pixmaps/chatgpt.png
```

You may also want the launcher to use an absolute executable path:

```text
Exec=/home/YOUR_USERNAME/.local/bin/chatgpt %U
```

Refresh:

```bash
update-desktop-database ~/.local/share/applications
```

Restart the XFCE panel if necessary:

```bash
xfce4-panel -r
```

The ChatGPT icon should now appear correctly in the application menu.

---

## 11. Clean up the temporary extraction files

Keep the actual installed application:

```text
~/.local/opt/chatgpt/
```

The temporary extraction directory can be removed:

```bash
rm -rf ~/Downloads/chatgpt-void-test/deb
```

You may keep the original known-good `.deb` as a rollback copy:

```text
~/Downloads/chatgpt-void-test/chatgpt_amd64.deb
```

or delete it later if you no longer need it.

---

## 12. Install the update script

Because this installation is not managed by XBPS, normal:

```bash
sudo xbps-install -Su
```

will **not** update ChatGPT.

The following script downloads OpenAI's current official `.deb`, validates it, checks for missing shared libraries, replaces the current user-local installation, and keeps one previous version for rollback.

Create:

```bash
nano ~/.local/bin/update-chatgpt
```

Paste:

```sh
#!/bin/sh
set -eu

URL="https://persistent.oaistatic.com/codex-app-prod/linux/deb/latest/chatgpt_amd64.deb"

APP_ROOT="$HOME/.local/opt/chatgpt"
BACKUP_ROOT="$HOME/.local/opt/chatgpt.previous"
BIN_DIR="$HOME/.local/bin"
BIN_LINK="$BIN_DIR/chatgpt"
DESKTOP_DIR="$HOME/.local/share/applications"
DESKTOP_FILE="$DESKTOP_DIR/chatgpt.desktop"
ICON_DIR="$HOME/.local/share/pixmaps"
ICON_FILE="$ICON_DIR/chatgpt.png"

die() {
    printf 'update-chatgpt: %s\n' "$*" >&2
    exit 1
}

need() {
    command -v "$1" >/dev/null 2>&1 || die "required command not found: $1"
}

ensure_closed() {
    if command -v pgrep >/dev/null 2>&1 && pgrep -x ChatGPT >/dev/null 2>&1; then
        die "ChatGPT is running. Fully quit it, then run this command again."
    fi
}

refresh_desktop_integration() {
    mkdir -p "$BIN_DIR" "$DESKTOP_DIR" "$ICON_DIR"

    [ -x "$APP_ROOT/usr/lib/chatgpt/codex-launcher" ] ||
        die "launcher missing after install: $APP_ROOT/usr/lib/chatgpt/codex-launcher"

    ln -sfn "$APP_ROOT/usr/lib/chatgpt/codex-launcher" "$BIN_LINK"

    if [ -f "$APP_ROOT/usr/share/applications/chatgpt.desktop" ]; then
        cp "$APP_ROOT/usr/share/applications/chatgpt.desktop" "$DESKTOP_FILE"

        sed -i "s|^Exec=.*|Exec=$BIN_LINK %U|" "$DESKTOP_FILE"

        icon_src=""
        if [ -f "$APP_ROOT/usr/share/pixmaps/chatgpt.png" ]; then
            icon_src="$APP_ROOT/usr/share/pixmaps/chatgpt.png"
        else
            icon_src="$(find "$APP_ROOT/usr/share" -type f -iname 'chatgpt*.png' -print 2>/dev/null | head -n 1 || true)"
        fi

        if [ -n "$icon_src" ] && [ -f "$icon_src" ]; then
            cp "$icon_src" "$ICON_FILE"
            sed -i "s|^Icon=.*|Icon=$ICON_FILE|" "$DESKTOP_FILE"
        fi
    fi

    if command -v update-desktop-database >/dev/null 2>&1; then
        update-desktop-database "$DESKTOP_DIR" >/dev/null 2>&1 || true
    fi

    if command -v xdg-mime >/dev/null 2>&1; then
        xdg-mime default chatgpt.desktop x-scheme-handler/codex >/dev/null 2>&1 || true
    fi
}

rollback() {
    ensure_closed
    [ -d "$BACKUP_ROOT" ] || die "no rollback copy exists at $BACKUP_ROOT"

    swap="$HOME/.local/opt/.chatgpt-swap.$$"
    [ ! -e "$swap" ] || die "temporary swap path already exists: $swap"

    printf 'Swapping current and previous ChatGPT installations...\n'
    mv "$APP_ROOT" "$swap"

    if mv "$BACKUP_ROOT" "$APP_ROOT"; then
        mv "$swap" "$BACKUP_ROOT"
    else
        mv "$swap" "$APP_ROOT" 2>/dev/null || true
        die "rollback failed; restored the original installation"
    fi

    refresh_desktop_integration

    version="$(cat "$APP_ROOT/.package-version" 2>/dev/null || printf 'unknown')"
    printf 'Rollback complete. Active version: %s\n' "$version"
    printf 'The version you replaced is retained at: %s\n' "$BACKUP_ROOT"
}

cleanup_backup() {
    ensure_closed
    if [ -d "$BACKUP_ROOT" ]; then
        rm -rf "$BACKUP_ROOT"
        printf 'Removed rollback copy: %s\n' "$BACKUP_ROOT"
    else
        printf 'No rollback copy exists.\n'
    fi
}

case "${1:-}" in
    --rollback)
        rollback
        exit 0
        ;;
    --cleanup-backup)
        cleanup_backup
        exit 0
        ;;
    -h|--help)
        cat <<'EOF'
Usage:
  update-chatgpt                  Download and install the latest official x64 .deb
  update-chatgpt --rollback       Swap back to the previous installed version
  update-chatgpt --cleanup-backup Delete the retained previous installation
EOF
        exit 0
        ;;
    "")
        ;;
    *)
        die "unknown option: $1 (try --help)"
        ;;
esac

ensure_closed

for cmd in curl ar tar grep sed find mktemp ldd; do
    need "$cmd"
done

mkdir -p "$HOME/.local/opt"
WORK="$(mktemp -d "$HOME/.local/opt/.chatgpt-update.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT HUP INT TERM

DEB="$WORK/chatgpt_amd64.deb"

printf 'Downloading the latest official ChatGPT Linux x64 package...\n'
curl --proto '=https' --tlsv1.2 -fL \
    --retry 3 --retry-delay 2 \
    -o "$DEB" "$URL"

members="$(ar t "$DEB")"
control_member="$(printf '%s\n' "$members" | grep '^control\.tar\.' | head -n 1 || true)"
data_member="$(printf '%s\n' "$members" | grep '^data\.tar\.' | head -n 1 || true)"

[ -n "$control_member" ] || die "downloaded file does not contain control.tar.*"
[ -n "$data_member" ] || die "downloaded file does not contain data.tar.*"

for member in "$control_member" "$data_member"; do
    case "$member" in
        *.xz) need xz ;;
        *.zst) need zstd ;;
        *.gz) need gzip ;;
        *.bz2) need bzip2 ;;
    esac
done

ar p "$DEB" "$control_member" > "$WORK/$control_member"
ar p "$DEB" "$data_member" > "$WORK/$data_member"

CONTROL_DIR="$WORK/control"
STAGE="$WORK/stage"
mkdir -p "$CONTROL_DIR" "$STAGE"

tar -xf "$WORK/$control_member" -C "$CONTROL_DIR"
control_file="$(find "$CONTROL_DIR" -type f -name control -print | head -n 1 || true)"
[ -n "$control_file" ] || die "package metadata is missing its control file"

package_name="$(sed -n 's/^Package:[[:space:]]*//p' "$control_file" | head -n 1)"
architecture="$(sed -n 's/^Architecture:[[:space:]]*//p' "$control_file" | head -n 1)"
latest_version="$(sed -n 's/^Version:[[:space:]]*//p' "$control_file" | head -n 1)"

[ "$package_name" = "chatgpt" ] || die "unexpected package name: $package_name"
[ "$architecture" = "amd64" ] || die "unexpected package architecture: $architecture"
[ -n "$latest_version" ] || die "could not determine package version"

current_version="$(cat "$APP_ROOT/.package-version" 2>/dev/null || printf 'unknown')"

printf 'Current tracked version: %s\n' "$current_version"
printf 'Downloaded version:      %s\n' "$latest_version"

if [ "$current_version" = "$latest_version" ]; then
    printf 'ChatGPT is already at the latest tracked version. Nothing changed.\n'
    exit 0
fi

printf 'Extracting and validating the new version...\n'
tar -xf "$WORK/$data_member" -C "$STAGE"

MAIN="$STAGE/usr/lib/chatgpt/ChatGPT"
LAUNCHER="$STAGE/usr/lib/chatgpt/codex-launcher"

[ -x "$MAIN" ] || die "package is missing the ChatGPT executable"
[ -x "$LAUNCHER" ] || die "package is missing codex-launcher"

missing="$(ldd "$MAIN" 2>&1 | grep 'not found' || true)"
if [ -n "$missing" ]; then
    printf '%s\n' "$missing" >&2
    die "new version has missing shared-library dependencies; existing install was not changed"
fi

printf '%s\n' "$latest_version" > "$STAGE/.package-version"

rm -rf "$BACKUP_ROOT"

if [ -d "$APP_ROOT" ]; then
    mv "$APP_ROOT" "$BACKUP_ROOT"
fi

if ! mv "$STAGE" "$APP_ROOT"; then
    if [ -d "$BACKUP_ROOT" ] && [ ! -d "$APP_ROOT" ]; then
        mv "$BACKUP_ROOT" "$APP_ROOT" 2>/dev/null || true
    fi
    die "could not activate the new version; attempted to restore the old one"
fi

refresh_desktop_integration

printf '\nChatGPT update complete: %s\n' "$latest_version"
if [ -d "$BACKUP_ROOT" ]; then
    printf 'Previous installation retained for rollback at:\n  %s\n' "$BACKUP_ROOT"
    printf 'After testing the new version, remove it with:\n  update-chatgpt --cleanup-backup\n'
fi
printf 'To roll back instead, run:\n  update-chatgpt --rollback\n'
```

Make it executable:

```bash
chmod +x ~/.local/bin/update-chatgpt
```

---

## 13. Updating ChatGPT

Close ChatGPT completely, then run:

```bash
update-chatgpt
```

The updater will:

1. download OpenAI's latest official `.deb`
2. validate the package name and architecture
3. extract it into a temporary staging directory
4. check the new executable with `ldd`
5. move the current install to:

```text
~/.local/opt/chatgpt.previous
```

6. activate the new version
7. refresh the command symlink, desktop entry, icon, and `codex:` handler

If the new version causes problems:

```bash
update-chatgpt --rollback
```

Once you are satisfied with the new version:

```bash
update-chatgpt --cleanup-backup
```

The updater's temporary working directory is automatically deleted at the end of the run, including the downloaded `.deb`.

---

## Resulting installation layout

A completed installation should look roughly like this:

```text
~/.local/opt/chatgpt/
    usr/
    .package-version

~/.local/bin/chatgpt
~/.local/bin/update-chatgpt

~/.local/share/applications/chatgpt.desktop
~/.local/share/pixmaps/chatgpt.png
```

Optional rollback copy after an update:

```text
~/.local/opt/chatgpt.previous/
```

---

## Useful commands

Launch ChatGPT:

```bash
chatgpt
```

Update:

```bash
update-chatgpt
```

Rollback:

```bash
update-chatgpt --rollback
```

Delete the previous-version backup:

```bash
update-chatgpt --cleanup-backup
```

Check the `codex:` handler:

```bash
xdg-mime query default x-scheme-handler/codex
```

Check the keyring daemon:

```bash
pgrep -f -a gnome-keyring-daemon
```

Check for missing libraries:

```bash
ldd ~/.local/opt/chatgpt/usr/lib/chatgpt/ChatGPT | grep 'not found'
```

---

## Removing ChatGPT

To remove this user-local installation:

```bash
rm -rf ~/.local/opt/chatgpt
rm -rf ~/.local/opt/chatgpt.previous
rm -f ~/.local/bin/chatgpt
rm -f ~/.local/bin/update-chatgpt
rm -f ~/.local/share/applications/chatgpt.desktop
rm -f ~/.local/share/pixmaps/chatgpt.png
```

Refresh the desktop database:

```bash
update-desktop-database ~/.local/share/applications
```

The GNOME Keyring and PAM changes are general desktop integration and do not have to be removed just because ChatGPT is removed.

---

## Notes

- This is a **user-local installation**. XBPS does not know that ChatGPT is installed.
- `xbps-install -Su` will not update ChatGPT.
- The application binaries still come directly from OpenAI's official Linux `.deb`.
- This approach avoids repackaging the application into XBPS format.
- XFCE can run GNOME Keyring perfectly well through the standard Secret Service D-Bus interface.
- Keeping one known-good `.deb` or one previous extracted installation is useful while the Linux app remains relatively new.
