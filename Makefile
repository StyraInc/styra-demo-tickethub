PROJECTS = $(wildcard ./frontend/* ./backend/*)
BACKENDS = $(shell cd backend; ls -d *)
FRONTENDS = $(shell cd frontend; ls -d *)

run:
	(trap 'kill 0' SIGINT; \
		$(MAKE) -C ./backend/$(BACKEND) run & \
		$(MAKE) -C ./frontend/$(FRONTEND) run)

run-go-html: BACKEND = go
run-go-html: FRONTEND = html
run-go-html: run

run-go-react: BACKEND = go
run-go-react: FRONTEND = react
run-go-react: run

run-java-html: BACKEND = java
run-java-html: FRONTEND = html
run-java-html: run

run-java-react: BACKEND = java
run-java-react: FRONTEND = react
run-java-react: run

run-node-html: BACKEND = node
run-node-html: FRONTEND = html
run-node-html: run

run-node-react: BACKEND = node
run-node-react: FRONTEND = react
run-node-react: run

.PHONY: clean
clean:
	rm -rf dist
	rm -rf build
	rm -rf target
	for proj in $(PROJECTS); do \
		if [ -d $$proj ]; then \
			echo "cleaning $$proj"; \
        	$(MAKE) -C $$proj clean; \
		fi; \
    done

tar-%: TARGET = tickethub-$(BACKEND)-$(FRONTEND)
tar-%:
	echo "Copying $(TARGET)"
	mkdir -p build/$(TARGET)
	cp templates/* build/$(TARGET)/
	mkdir -p build/$(TARGET)/frontend
	cp -r frontend/$(FRONTEND)/. build/$(TARGET)/frontend/
	mkdir -p build/$(TARGET)/backend
	cp -r backend/$(BACKEND)/. build/$(TARGET)/backend/
	mkdir -p dist
	tar -czvf dist/$(TARGET).tar.gz -C build/$(TARGET) .

package-go-html: BACKEND = go
package-go-html: FRONTEND = html
package-go-html: tar-go-html

package-go-react: BACKEND = go
package-go-react: FRONTEND = react
package-go-react: tar-go-react

package-java-html: BACKEND = java
package-java-html: FRONTEND = html
package-java-html: tar-java-html

package-java-react: BACKEND = java
package-java-react: FRONTEND = react
package-java-react: tar-java-react

package-node-html: BACKEND = node
package-node-html: FRONTEND = html
package-node-html: tar-node-html

package-node-react: BACKEND = node
package-node-react: FRONTEND = react
package-node-react: tar-node-react

package-all: package-node-html package-node-react package-java-html package-java-react package-go-html package-go-react
