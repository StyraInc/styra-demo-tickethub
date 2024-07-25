#!/bin/sh

# Entrypoint for the tickethub Docker container.

set -e
set -u
set -x

cd /src/tickethub-springboot
./gradlew run -x test -x testClasses
