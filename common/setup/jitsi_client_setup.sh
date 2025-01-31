# chrome installation https://www.skynats.com/blog/install-google-chrome-headless-ubuntu-server/
sudo apt update
yes | sudo apt install libappindicator1 fonts-liberation
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
yes | sudo apt --fix-broken install
sudo dpkg -i google-chrome-stable_current_amd64.deb

# puppeteer installation
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install --lts
npm install puppeteer
cp -r /usr/local/dos-mitigation/common/puppeteer/ ./