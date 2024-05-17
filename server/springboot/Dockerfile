FROM eclipse-temurin:19-alpine

ADD . /src/tickethub-springboot

RUN chmod +x /src/tickethub-springboot/docker_entrypoint.sh && \
	cd /src/tickethub-springboot && \
	./gradlew build

EXPOSE 8080
CMD [ "/bin/sh", "/src/tickethub-springboot/docker_entrypoint.sh"]
