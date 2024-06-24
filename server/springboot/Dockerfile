FROM eclipse-temurin:19

ADD . /src/tickethub-springboot

RUN chmod +x /src/tickethub-springboot/docker_entrypoint.sh && \
	cd /src/tickethub-springboot && \
	./gradlew build -x test -x testClasses

EXPOSE 8080
CMD [ "/bin/sh", "/src/tickethub-springboot/docker_entrypoint.sh"]
