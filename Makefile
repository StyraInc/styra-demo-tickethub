PROJECTS = $(wildcard ./client/* ./server/*)
OPA_IMAGE ?= ghcr.io/styrainc/enterprise-opa:latest
OPA ?= docker run -v ${PWD}/policies:/w/policies:rw -w /w ${OPA_IMAGE}

entrypoint := "tickets/allow"
files := $(wildcard ./policies/*.rego ./policies/*.json)
policies/bundle.tar.gz: $(files)
	$(OPA) build -o $@ $(files)

client/react/public/opa.wasm: $(files)
	$(OPA) build -t wasm -o policies/tmp.tar.gz -e $(entrypoint) $(files)
	tar zxf policies/tmp.tar.gz /policy.wasm
	mv policy.wasm $@
	rm policies/tmp.tar.gz

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

run-aspnetcore-html: SERVER = aspnetcore
run-aspnetcore-html: CLIENT = html
run-aspnetcore-html: run

run-aspnetcore-react: SERVER = aspnetcore
run-aspnetcore-react: CLIENT = react
run-aspnetcore-react: run

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

package-aspnetcore-html: SERVER = aspnetcore
package-aspnetcore-html: CLIENT = html
package-aspnetcore-html: tar-aspnetcore-html

package-aspnetcore-react: SERVER = aspnetcore
package-aspnetcore-react: CLIENT = react
package-aspnetcore-react: tar-aspnetcore-react

package-all: package-node-html package-node-react package-java-html package-java-react package-csharp-html package-csharp-react package-aspnetcore-html package-aspnetcore-react  package-go-html package-go-react

SERVER ?= node
reset-database:
	psql -h localhost -p 5432 -U postgres -d postgres -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
	psql -h localhost -p 5432 -U postgres -d postgres -f ./server/$(SERVER)/database/init.sql

test-policies:
	$(OPA) test -v policies
