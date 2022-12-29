#!/bin/bash
echo 'Connect to Server...'

# Если npm install завершается Killed
# sudo fallocate -l 1G /swapfile
# sudo chmod 600 /swapfile
# sudo mkswap /swapfile
# sudo swapon /swapfile
# sudo swapon --show
# sudo cp /etc/fstab /etc/fstab.bak
# echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
# sudo sysctl vm.swappiness=10
# echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
# sudo sysctl vm.vfs_cache_pressure=50
# echo 'vm.vfs_cache_pressure=50' | sudo tee -a /etc/sysctl.conf

umask 777
ssh -tt -i ~/.ssh/id_rsa root@188.225.42.148 << EOF
sudo apt -y update
sudo curl -sL https://deb.nodesource.com/setup_14.x | sudo bash -
sudo apt -y install nodejs
node -v
npm -v
sudo apt -y install nginx
sudo apt -y install git
sudo apt -y install mongodb-server
sudo apt -y install certbot python3-certbot-nginx
sudo apt-get -y install build-essential
sudo npm install -g pm2
sudo npm install -g nx
sudo /bin/dd if=/dev/zero of=/var/swap.1 bs=1M count=1024
sudo /sbin/mkswap /var/swap.1
sudo /sbin/swapon /var/swap.1
sudo ufw allow 'Nginx Full'
sudo ufw delete allow 'Nginx HTTP'
sudo ufw enable
ufw allow ssh
git clone https://github.com/Sasha9a/Bot-Melissa.git
cd Bot-Melissa
sudo npm install
nx affected:build --all --prod
sudo systemctl enable mongodb
sudo pm2 start dist/apps/app/main.js
sudo pm2 save
sudo pm2 startup
exit
EOF

echo 'Finish!'
