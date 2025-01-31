# https://jitsi.github.io/handbook/docs/devops-guide/devops-guide-quickstart/
# get required packages
sudo apt update
sudo apt install apt-transport-https
sudo apt update

# add prosody package repo
echo deb http://packages.prosody.im/debian $(lsb_release -sc) main | sudo tee -a /etc/apt/sources.list
wget https://prosody.im/files/prosody-debian-packages.key -O- | sudo apt-key add -
sudo apt install lua5.2

# add jitsi package repo
curl https://download.jitsi.org/jitsi-key.gpg.key | sudo sh -c 'gpg --dearmor > /usr/share/keyrings/jitsi-keyring.gpg'
echo 'deb [signed-by=/usr/share/keyrings/jitsi-keyring.gpg] https://download.jitsi.org stable/' | sudo tee /etc/apt/sources.list.d/jitsi-stable.list > /dev/null

# configure firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 10000/udp
sudo ufw allow 22/tcp
sudo ufw allow 3478/udp
sudo ufw allow 5349/tcp
yes | sudo ufw enable

# install jitsi meet
# https://github.com/jitsi/jitsi-meet/issues/7879
# https://stackoverflow.com/questions/48050452/automatically-entering-value-when-dialogue-appears-shell
server_name=$1
server_ip=$(/usr/local/dos-mitigation/common/bin/hostname_to_ip $server_name)
sudo apt install debconf-utils
echo "jitsi-videobridge jitsi-videobridge/jvb-hostname string $server_ip" | sudo debconf-set-selections
echo "jitsi-meet-web-config jitsi-meet/cert-choice select Generate a new self-signed certificate" | sudo debconf-set-selections
sudo DEBIAN_FRONTEND=noninteractive apt-get -y install jitsi-meet