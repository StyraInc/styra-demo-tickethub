FROM alpine:latest

COPY --from=openpolicyagent/opa:latest-static /opa /usr/bin/opa

RUN echo "#!/bin/sh" > /entrypoint.sh && \
  echo "opa build -o /bundle.tar.gz --bundle /policies"  >> /entrypoint.sh && \
  echo 'opa $@' >> /entrypoint.sh && \
  chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["run"]



