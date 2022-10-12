run-node-html:
	(trap 'kill 0' SIGINT; \
		$(MAKE) -C ./backend/node run & \
		$(MAKE) -C ./frontend/html run)

run-node-react:
	(trap 'kill 0' SIGINT; \
		$(MAKE) -C ./backend/node run & \
		$(MAKE) -C ./frontend/react run)

run-java-html:
	(trap 'kill 0' SIGINT; \
		$(MAKE) -C ./backend/java run & \
		$(MAKE) -C ./frontend/html run)

run-java-react:
	(trap 'kill 0' SIGINT; \
		$(MAKE) -C ./backend/java run & \
		$(MAKE) -C ./frontend/react run)
