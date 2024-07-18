FROM eclipse-temurin:19

ADD . /src/tickethub-springboot

# TODO: for local dev only
RUN mkdir -p /src/opa-springboot && \
    mkdir -p /mnt/opa-springboot

RUN chmod +x /src/tickethub-springboot/docker_entrypoint.sh # && \
	#cd /src/tickethub-springboot && \
	##./gradlew build -x test -x testClasses

EXPOSE 8080
CMD [ "/bin/sh", "/src/tickethub-springboot/docker_entrypoint.sh"]
