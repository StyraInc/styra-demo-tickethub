#!/bin/sh

set -e
set -u
set -x

cp -R /mnt/tickethub-ui-react/* /src/tickethub-ui-react
cd /src/tickethub-ui-react

npm install
npm run start
