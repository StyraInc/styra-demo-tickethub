PROJECTS = $(wildcard ./client/* ./server/*)
OPA_IMAGE ?= docker.io/openpolicyagent/opa:latest
OPA ?= docker run -v ${PWD}/policies:/w/policies -w /w ${OPA_IMAGE}

files := $(wildcard ./policies/*.rego ./policies/*.json)
policies/bundle.tar.gz: $(files)
	$(OPA) build -o $@ $(files)

run:
	(trap 'kill 0' SIGINT; \
		$(MAKE) -C ./server/$(SERVER) run & \
		$(MAKE) -C ./client/$(CLIENT) run)

run-go-html: SERVER = go
run-go-html: CLIENT = html
run-go-html: run

run-go-react: SERVER = go
run-go-react: CLIENT = react
run-go-react: run

run-java-html: SERVER = java
run-java-html: CLIENT = html
run-java-html: run

run-java-react: SERVER = java
run-java-react: CLIENT = react
run-java-react: run

run-node-html: SERVER = node
run-node-html: CLIENT = html
run-node-html: run

run-node-react: SERVER = node
run-node-react: CLIENT = react
run-node-react: run

run-csharp-html: SERVER = csharp
run-csharp-html: CLIENT = html
run-csharp-html: run

run-csharp-react: SERVER = csharp
run-csharp-react: CLIENT = react
run-csharp-react: run

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

tar-%: TARGET = tickethub-$(SERVER)-$(CLIENT)
tar-%:
	echo "Copying $(TARGET)"
	mkdir -p build/$(TARGET)
	cp templates/* build/$(TARGET)/
	mkdir -p build/$(TARGET)/client
	cp -r client/$(CLIENT)/. build/$(TARGET)/client/
	mkdir -p build/$(TARGET)/server
	cp -r server/$(SERVER)/. build/$(TARGET)/server/
	mkdir -p dist
	tar -czvf dist/$(TARGET).tar.gz -C build/$(TARGET) .

package-go-html: SERVER = go
package-go-html: CLIENT = html
package-go-html: tar-go-html

package-go-react: SERVER = go
package-go-react: CLIENT = react
package-go-react: tar-go-react

package-java-html: SERVER = java
package-java-html: CLIENT = html
package-java-html: tar-java-html

package-java-react: SERVER = java
package-java-react: CLIENT = react
package-java-react: tar-java-react

package-node-html: SERVER = node
package-node-html: CLIENT = html
package-node-html: tar-node-html

package-node-react: SERVER = node
package-node-react: CLIENT = react
package-node-react: tar-node-react

package-csharp-html: SERVER = csharp
package-csharp-html: CLIENT = html
package-csharp-html: tar-csharp-html

package-csharp-react: SERVER = csharp
package-csharp-react: CLIENT = react
package-csharp-react: tar-csharp-react

package-all: package-node-html package-node-react package-java-html package-java-react package-csharp-html package-csharp-react package-go-html package-go-react
