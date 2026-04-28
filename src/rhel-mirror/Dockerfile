FROM registry.redhat.io/rhel9/support-tools:9.7

RUN dnf -y install \
      dnf-plugins-core \
      findutils \
      bash \
    && dnf clean all

COPY reposync-entrypoint.sh /usr/local/bin/reposync-entrypoint.sh
RUN chmod 0755 /usr/local/bin/reposync-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/reposync-entrypoint.sh"]
