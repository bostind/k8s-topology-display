# 使用 Nginx 官方镜像作为基础镜像
FROM nginx:alpine

# 安装 curl 和 bash，以便后续安装 kubectl 和 jq
RUN apk add --no-cache curl bash jq

# 安装 kubectl

RUN curl -LO "https://dl.k8s.io/release/v1.30.5/bin/linux/amd64/kubectl" && \
    chmod +x ./kubectl && \
    mv ./kubectl /usr/local/bin/kubectl

# 复制自定义 Nginx 配置和 HTML 文件

COPY index.html /usr/share/nginx/html/
COPY mermaid.min.js /usr/share/nginx/html/
COPY labelstomermaind.sh /usr/local/bin/labelstomermaind.sh
COPY config /root/.kube/config
COPY label30.sh /usr/local/bin/label30.sh
RUN chmod +x /usr/local/bin/labelstomermaind.sh
RUN chmod +x /usr/local/bin/label30.sh
EXPOSE 80

# 启动 Nginx
CMD ["/bin/sh", "-c", "/usr/local/bin/label30.sh & nginx -g 'daemon off;'"]