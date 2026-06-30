#!/bin/bash
set -e

INSTALL_DIR="/home/ubuntu/minecraft-bedrock"
SERVICE_NAME="minecraft-bedrock"
BEDROCK_VERSION="1.26.32.2"
DOWNLOAD_URL="https://www.minecraft.net/bedrockdedicatedserver/bin-linux/bedrock-server-${BEDROCK_VERSION}.zip"

# Funciona como root (EC2 User Data) y como usuario normal
if [ "$(id -u)" -eq 0 ]; then SUDO=""; else SUDO="sudo"; fi

echo "[1/6] Instalando dependencias..."
$SUDO apt-get update -qq
$SUDO apt-get install -y -q unzip screen curl libcurl4 libssl3

echo "[2/6] Descargando Minecraft Bedrock Server ${BEDROCK_VERSION}..."
mkdir -p "${INSTALL_DIR}"
cd "${INSTALL_DIR}"
curl -H "Accept-Encoding: identity" -H "Accept-Language: en" \
     -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0" \
     -L -o bedrock-server.zip "${DOWNLOAD_URL}"

echo "[3/6] Extrayendo servidor..."
unzip -q bedrock-server.zip
chmod +x bedrock_server

echo "[4/6] Configurando server.properties..."
sed -i 's/^server-name=.*/server-name=Mi Servidor Minecraft/' server.properties
sed -i 's/^view-distance=.*/view-distance=10/' server.properties
sed -i 's/^tick-distance=.*/tick-distance=4/' server.properties
sed -i 's/^max-players=.*/max-players=10/' server.properties
sed -i 's/^max-threads=.*/max-threads=2/' server.properties
sed -i 's/^difficulty=.*/difficulty=normal/' server.properties
sed -i 's/^allow-list=.*/allow-list=false/' server.properties

echo "[5/6] Corrigiendo permisos..."
$SUDO chown -R ubuntu:ubuntu "${INSTALL_DIR}"

echo "[6/6] Creando servicio systemd..."
$SUDO tee /etc/systemd/system/${SERVICE_NAME}.service > /dev/null << 'SERVICEEOF'
[Unit]
Description=Minecraft Bedrock Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/minecraft-bedrock
Environment=LD_LIBRARY_PATH=.
ExecStart=/home/ubuntu/minecraft-bedrock/bedrock_server
Restart=on-failure
RestartSec=5
StandardInput=null

[Install]
WantedBy=multi-user.target
SERVICEEOF

$SUDO systemctl daemon-reload
$SUDO systemctl enable "${SERVICE_NAME}"
$SUDO systemctl start "${SERVICE_NAME}"

echo ""
echo "====================================="
echo " Servidor Minecraft Bedrock listo!"
echo "====================================="
echo " Puerto UDP: 19132"
echo " Version: ${BEDROCK_VERSION}"
echo " Directorio: ${INSTALL_DIR}"
echo ""
echo " sudo systemctl status ${SERVICE_NAME}"
echo " sudo journalctl -u ${SERVICE_NAME} -f"
echo "====================================="

