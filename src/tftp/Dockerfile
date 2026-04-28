FROM ubuntu:24.04 AS builder

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    git build-essential liblzma-dev \
    mtools genisoimage \
    binutils perl wget \
    gcc g++ \
    gcc-multilib g++-multilib \
    libc6-dev-i386 \
    && apt-get clean

RUN git clone --depth=1 https://github.com/ipxe/ipxe.git /ipxe

# Script embebido: DHCP + chain al backend dinámico por MAC
RUN cat > /ipxe/src/embedded.ipxe << 'EOF'
#!ipxe
dhcp
chain http://192.168.1.70:8081/boot/${net0/mac:hexhyp}
EOF

WORKDIR /ipxe/src

# Compilar ipxe.efi (UEFI x64)
RUN make bin-x86_64-efi/ipxe.efi EMBED=/ipxe/src/embedded.ipxe

# Compilar undionly.kpxe (BIOS legacy)
RUN make bin/undionly.kpxe EMBED=/ipxe/src/embedded.ipxe


FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    tftpd-hpa \
    iproute2 \
    net-tools \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /tftpboot

COPY --from=builder /ipxe/src/bin-x86_64-efi/ipxe.efi /tftpboot/ipxe.efi
COPY --from=builder /ipxe/src/bin/undionly.kpxe /tftpboot/undionly.kpxe

RUN chmod 644 /tftpboot/ipxe.efi /tftpboot/undionly.kpxe

EXPOSE 69/udp

CMD ["/usr/sbin/in.tftpd", "--foreground", "--verbose", "--address", "0.0.0.0:69", "--secure", "/tftpboot"]
