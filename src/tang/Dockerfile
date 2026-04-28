FROM ubuntu:24.04

RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y tang && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /var/db/tang

EXPOSE 80

CMD ["/usr/libexec/tangd", "-l", "-p", "80", "/var/db/tang"]
