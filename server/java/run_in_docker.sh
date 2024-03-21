#!/bin/sh

# Compile and execute the tickethub Java server using a Docker container.

cd "$(dirname "$0")"
set -e
set -u
set -x

docker build . --file ./Dockerfile --tag tickethub-java:vlocal

# TODO: make this not be dependant on Charls's laptop

docker run \
	--volume ./:/mnt/tickethub-java:ro \
	--volume /home/cad-styra/f/src/opa-java/build/libs:/mnt/libs:ro \
	--network=host \
	--rm \
	--tty \
	--interactive \
	--init \
	tickethub-java:vlocal sh /bin/entrypoint.sh
