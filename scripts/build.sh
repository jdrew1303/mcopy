#!/bin/sh

./node_modules/.bin/tsc -p tsconfig.json

#electron-build fails when local modules are in parent directory
#copy them into lib directory
cp -r ./lib/ ./app/lib