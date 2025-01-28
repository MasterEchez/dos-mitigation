# chrome installation https://www.skynats.com/blog/install-google-chrome-headless-ubuntu-server/
sudo apt update
yes | sudo apt install libappindicator1 fonts-liberation
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
yes | sudo apt --fix-broken install
sudo dpkg -i google-chrome-stable_current_amd64.deb