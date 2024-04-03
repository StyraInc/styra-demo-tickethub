FROM eclipse-temurin:19-alpine

ADD ./docker_entrypoint.sh /bin/entrypoint.sh


RUN chmod +x /bin/entrypoint.sh && \
	mkdir -p /src/tickethub-java && \
	apk add git

# TODO: change back to main branch

RUN cd /src && \
	git clone https://github.com/StyraInc/opa-java.git && \
	cd opa-java && \
	rm -f ./gradlew.bat && \
	git checkout charles/porcelain-api && \
	./gradlew build

EXPOSE 4000
CMD [ "/bin/sh", "/bin/entrypoint.sh"]
