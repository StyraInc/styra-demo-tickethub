run-backend:
	$(MAKE) -C ./backend run

run-frontend:
	$(MAKE) -C ./frontend run

run:
	(trap 'kill 0' SIGINT; \
		$(MAKE) -C ./backend run & \
		$(MAKE) -C ./frontend run)
