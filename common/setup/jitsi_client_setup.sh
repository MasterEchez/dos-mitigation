# chrome installation https://www.skynats.com/blog/install-google-chrome-headless-ubuntu-server/
sudo apt update
yes | sudo apt install libappindicator1 fonts-liberation
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
yes | sudo apt --fix-broken install
sudo dpkg -i google-chrome-stable_current_amd64.deb

# four people download
FOUR_PEOPLE_Y4M="fourpeople.y4m"
curl -s https://media.xiph.org/video/derf/y4m/FourPeople_1280x720_60.y4m -o $FOUR_PEOPLE_Y4M

# puppeteer installation (part 1)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
nvm install --lts
npm install puppeteer
npm install puppeteer-screen-recorder --legacy-peer-deps # creator removed >=puppeteer@19.0.0 per dep for some reason