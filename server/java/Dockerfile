FROM eclipse-temurin:19

ADD . /src/tickethub-java

RUN chmod +x /src/tickethub-java/docker_entrypoint.sh && \
	cd /src/tickethub-java && \
	./gradlew build

EXPOSE 4000
CMD [ "/bin/sh", "/src/tickethub-java/docker_entrypoint.sh"]
