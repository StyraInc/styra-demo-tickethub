#!/bin/sh

# Entrypoint for the tickethub Docker container.

set -e
set -u
set -x

cp -R /mnt/tickethub-java/* /src/tickethub-java/
cd /src/tickethub-java
./gradlew clean
./gradlew run
