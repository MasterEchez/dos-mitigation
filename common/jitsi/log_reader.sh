#!/bin/sh
echo "Jicofo Log"

timeout 5s tail -f /var/log/jitsi/jicofo.log

printf "\n"
echo "JVB Log"

timeout 5s tail -f /var/log/jitsi/jvb.log
printf "\n"
echo "Prosody Log"

timeout 5s tail -f /var/log/prosody/prosody.log

printf "\n"
timeout 5s tail -f /var/log/nginx/access.log