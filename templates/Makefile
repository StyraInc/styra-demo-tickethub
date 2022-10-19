run-server:
	$(MAKE) -C ./server run

run-client:
	$(MAKE) -C ./client run

run:
	(trap 'kill 0' SIGINT; \
		$(MAKE) -C ./server run & \
		$(MAKE) -C ./client run)
