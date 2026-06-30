#!/bin/bash
set -e

if [ "$(id -u)" -eq 0 ]; then SUDO=""; else SUDO="sudo"; fi

$SUDO apt-get update -qq
$SUDO apt-get install -y -q nginx git

git clone https://github.com/jpdelmuro/conf.git /tmp/conf
$SUDO cp /tmp/conf/Pagina/* /var/www/html/
$SUDO rm -f /var/www/html/index.nginx-debian.html
rm -rf /tmp/conf

$SUDO systemctl enable nginx
$SUDO systemctl restart nginx

IP=$(curl -sf http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "la-ip-de-la-instancia")
echo "Listo: http://${IP}"
