#!/bin/bash
# Check the architecture of the system
if [[ $(getconf LONG_BIT) == "64" ]]; then
    # Download the latest 64-bit Chrome package
    wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
    # Install the package using the appropriate command
    if command -v apt-get >/dev/null; then
        apt install -qq -y ./google-chrome-stable_current_amd64.deb
    else
        yum localinstall -qq -y ./google-chrome-stable_current_amd64.deb
    fi
    # Remove the downloaded package
    rm -f google-chrome-stable_current_amd64.deb
else
    # Chrome is not supported on 32-bit Linux architectures
    echo "Chrome is not available for 32-bit Linux systems"
    exit 1
fi
