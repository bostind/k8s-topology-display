# 使用 Nginx 官方镜像作为基础镜像
FROM nginx:alpine

# 安装 curl 和 bash，以便后续安装 kubectl 和 jq
RUN apk add --no-cache curl bash jq

# 安装 kubectl

RUN curl -LO "https://dl.k8s.io/release/v1.30.5/bin/linux/amd64/kubectl" && \
    chmod +x ./kubectl && \
    mv ./kubectl /usr/local/bin/kubectl

# 复制自定义 Nginx 配置和 HTML 文件
COPY mermaid.min.js /usr/share/nginx/html/

COPY config /root/.kube/config

COPY index.html /usr/share/nginx/html/
COPY pod.html /usr/share/nginx/html/
COPY k8s_node_labels_extracted.txt /usr/share/nginx/html/
COPY node_subgraph.txt /usr/share/nginx/html/
COPY pods_summary.txt /usr/share/nginx/html/
COPY pod_subgraph.txt /usr/share/nginx/html/

COPY timer.sh /usr/local/bin/timer.sh
COPY pods_info.sh /usr/local/bin/pods_info.sh
COPY labelpod_distribution.sh /usr/local/bin/labelpod_distribution.sh
COPY labelstomermaind.sh /usr/local/bin/labelstomermaind.sh


RUN chmod +x /usr/local/bin/timer.sh
RUN chmod +x /usr/local/bin/pods_info.sh
RUN chmod +x /usr/local/bin/labelpod_distribution.sh
RUN chmod +x /usr/local/bin/labelstomermaind.sh

EXPOSE 80

# 启动 Nginx
CMD ["/bin/sh", "-c", "/usr/local/bin/timer.sh & nginx -g 'daemon off;'"]