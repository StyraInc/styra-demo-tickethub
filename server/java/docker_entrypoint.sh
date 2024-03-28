#!/bin/sh

# Entrypoint for the tickethub Docker container.

set -e
set -u
set -x

cp -R /mnt/tickethub-java/* /src/tickethub-java/
cp /src/opa-java/build/libs/api.jar /src/tickethub-java/libs
cd /src/tickethub-java
./gradlew clean
./gradlew run
