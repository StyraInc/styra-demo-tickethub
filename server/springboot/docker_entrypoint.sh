#!/bin/sh

# Entrypoint for the tickethub Docker container.

set -e
set -u
set -x

# TODO: for local dev only
cd /src/opa-springboot
cp -R /mnt/opa-springboot/* ./
./gradlew publishToMavenLocal -Pskip.signing

find ~/.m2/repository

cd /src/tickethub-springboot
./gradlew clean -x test -x testClasses
./gradlew run -x test -x testClasses
