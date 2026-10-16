#!/usr/bin/env bash
# 21-day: one-time setup for self-hosting with Docker Compose.
#
#   curl -fsSL https://get.sid426.dev/21-day-init | bash
#   (short link for https://raw.githubusercontent.com/sidhartha426/21-day/main/docs/hosting/init.sh)
#
# Creates ./21-day (compose file, Caddyfile, CouchDB config, .env) in the current directory.

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/sidhartha426/21-day.git}"
REPO_BRANCH="${REPO_BRANCH:-}"
SOURCE_DIR="21-day-source"
TARGET_DIR="21-day"
# The app container runs as the image's non-root "node" user.
APP_UID=1000
APP_GID=1000

if [ -t 1 ]; then
  BOLD=$'\033[1m'; DIM=$'\033[2m'; RED=$'\033[31m'; GREEN=$'\033[32m'
  YELLOW=$'\033[33m'; CYAN=$'\033[36m'; RESET=$'\033[0m'
else
  BOLD=''; DIM=''; RED=''; GREEN=''; YELLOW=''; CYAN=''; RESET=''
fi

step() { printf '%s==>%s %s\n' "$CYAN" "$RESET" "$1"; }
warn() { printf '%s!%s %s\n' "$YELLOW" "$RESET" "$1"; }
fail() { printf '%sError:%s %s\n' "$RED" "$RESET" "$1" >&2; exit 1; }

command -v git >/dev/null 2>&1 || fail "git is not installed."
command -v docker >/dev/null 2>&1 || warn "docker is not installed yet. You will need Docker with the Compose plugin to run the stack."

[ -e "$TARGET_DIR" ] && fail "./$TARGET_DIR already exists. Remove or rename it first (your data lives there!)."
[ -e "$SOURCE_DIR" ] && fail "./$SOURCE_DIR already exists. Remove it and run this script again."

step "Cloning $REPO_URL"
clone_args=(--depth 1)
[ -n "$REPO_BRANCH" ] && clone_args+=(--branch "$REPO_BRANCH")
git clone --quiet "${clone_args[@]}" "$REPO_URL" "$SOURCE_DIR"

[ -d "$SOURCE_DIR/docs/hosting" ] || fail "docs/hosting was not found in the cloned repository."

step "Creating ./$TARGET_DIR"
mv "$SOURCE_DIR/docs/hosting" "$TARGET_DIR"
rm -rf "$SOURCE_DIR"

step "Creating .env from .env.docker.example"
mv "$TARGET_DIR/.env.docker.example" "$TARGET_DIR/.env"
chmod 600 "$TARGET_DIR/.env"

DATA_DIRS=(app/data couchdb/data caddy/data caddy/config)
step "Creating data directories: ${DATA_DIRS[*]}"
for dir in "${DATA_DIRS[@]}"; do
  mkdir -p "$TARGET_DIR/$dir"
done
if [ "$(id -u)" -eq 0 ]; then
  chown "$APP_UID:$APP_GID" "$TARGET_DIR/app/data"
elif [ "$(id -u)" -ne "$APP_UID" ]; then
  warn "The app container writes ./$TARGET_DIR/app/data as uid $APP_UID. Run:"
  printf '    sudo chown %s:%s %s/app/data\n' "$APP_UID" "$APP_GID" "$TARGET_DIR"
fi

TARGET_PATH="$(cd "$TARGET_DIR" && pwd)"

cat <<EOF

${GREEN}${BOLD}  21-day is ready to configure.${RESET}
${DIM}  ─────────────────────────────────────────────────────────────${RESET}
  Everything lives in: ${BOLD}${TARGET_PATH}${RESET}

  ${BOLD}1. Fill in the values in .env${RESET}
     ${CYAN}cd ${TARGET_DIR} && nano .env${RESET}

     ${BOLD}BETTER_AUTH_SECRET${RESET}   generate one: ${CYAN}openssl rand -base64 32${RESET}
     ${BOLD}BETTER_AUTH_URL${RESET}      public URL, e.g. https://21-day.example.com
     ${BOLD}COUCHDB_PASSWORD${RESET}     a strong password
     ${BOLD}APP_DOMAIN${RESET}           e.g. 21-day.example.com
     ${BOLD}ACME_EMAIL${RESET}           email for Let's Encrypt
     ${BOLD}DESEC_API_KEY${RESET}        deSEC API token, if your domain's DNS is hosted at deSEC
     ${DIM}Optional: SMTP_* (email reports, invites), HTTPS_PORT (default 443)${RESET}
     ${DIM}DNS hosted elsewhere? See "TLS certificates" in the README.${RESET}

  ${BOLD}2. Start the stack${RESET}
     ${CYAN}docker compose up -d${RESET}

  ${BOLD}3. Open BETTER_AUTH_URL and create the first account.${RESET}
     ${DIM}It becomes the administrator.${RESET}

  ${YELLOW}Backup:${RESET} stop the stack and archive the whole folder:
     ${CYAN}docker compose down && sudo tar -czpf 21-day-backup.tar.gz -C .. ${TARGET_DIR}${RESET}
${DIM}  ─────────────────────────────────────────────────────────────${RESET}

EOF
