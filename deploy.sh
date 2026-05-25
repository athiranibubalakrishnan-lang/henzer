#!/bin/bash
set -e

WEB_ROOT="/var/www/html/n2n-frontend"
ZIP_FILE="$WEB_ROOT/dist.zip"

echo "==> Step 1: Cleaning old deployed files (keeping dist.zip)..."
sudo find "$WEB_ROOT" -mindepth 1 ! -name 'dist.zip' -delete

echo "==> Step 2: Unzipping dist.zip into web root..."
sudo unzip -o "$ZIP_FILE" -d "$WEB_ROOT"

echo "==> Step 3: Verifying index.html exists..."
if [ ! -f "$WEB_ROOT/index.html" ]; then
  echo "ERROR: index.html not found in $WEB_ROOT after unzip!"
  echo "Contents of $WEB_ROOT:"
  ls -la "$WEB_ROOT"
  exit 1
fi
echo "index.html found."

echo "==> Step 4: Fixing file ownership and permissions..."
sudo chown -R nginx:nginx "$WEB_ROOT"
sudo chmod -R 755 "$WEB_ROOT"

echo "==> Step 5: Applying SELinux labels (if applicable)..."
if command -v chcon &> /dev/null; then
  sudo chcon -Rt httpd_sys_content_t "$WEB_ROOT"
  echo "SELinux labels applied."
else
  echo "chcon not found, skipping SELinux step."
fi

echo "==> Step 6: Restarting Nginx..."
sudo systemctl restart nginx

echo ""
echo "✅ Deployment complete! Site should be live at http://henzeronline.com"
