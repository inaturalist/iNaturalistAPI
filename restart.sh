#!/bin/sh
killall node
. /Users/pleary/.nvm/nvm.sh
nvm use v8.9.1
PORT=4000 nohup node app.js >/dev/null 2>&1 &
PORT=4001 nohup node app.js >/dev/null 2>&1 &
