#!/bin/bash
if [ -t 0 ]; then
    http-server . -c-1 -p8080 -a localhost -o --log-ip --no-dotfiles -g true -b true
    exit
fi
x-terminal-emulator -e "bash ./dev.sh"
