#!/bin/sh

# Compile and execute the tickethub React UI using a Docker container.

cd "$(dirname "$0")"
set -e
set -u
set -x

docker build . --file ./Dockerfile --tag tickethub-ui-node:vlocal

docker run \
	--volume ./:/mnt/tickethub-ui-react:ro \
	--network=host \
	--rm \
	--tty \
	--interactive \
	--init \
	tickethub-ui-node:vlocal sh /bin/entrypoint.sh
