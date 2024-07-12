FROM alpine:latest

COPY --from=ghcr.io/styrainc/enterprise-opa:latest /ko-app/enterprise-opa-private /usr/bin/opa

RUN echo "#!/bin/sh" > /entrypoint.sh && \
    echo "opa build -o /bundle.tar.gz --bundle /policies"  >> /entrypoint.sh && \
    echo 'opa "$@"' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["run"]
