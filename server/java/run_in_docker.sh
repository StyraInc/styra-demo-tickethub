#!/bin/sh

# Compile and execute the tickethub Java server using a Docker container.

cd "$(dirname "$0")"
set -e
set -u
set -x

if [ ! -f "./libs/api.jar" ] ; then
	echo "no libs/api.jar, did you forgot to include the SDK JAR?" 1>&2
	exit 1
fi

docker build . --file ./Dockerfile --tag tickethub-java:vlocal

# TODO: make this not be dependant on Charls's laptop

docker run \
	--volume ./:/mnt/tickethub-java:ro \
	--network=host \
	--rm \
	--tty \
	--interactive \
	--init \
	tickethub-java:vlocal sh /bin/entrypoint.sh
