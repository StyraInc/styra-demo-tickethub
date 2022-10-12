run-node-html:
	(trap 'kill 0' SIGINT; \
		$(MAKE) -C ./backend/node run & \
		$(MAKE) -C ./frontend/html run)