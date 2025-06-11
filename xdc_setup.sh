#!/bin/bash

# Install Dependencies
apt update
apt install -y ansible nano man-db zip net-tools rsync unminimize
yes | unminimize