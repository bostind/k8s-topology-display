#!/bin/bash

# 输出文件
OUTPUT_FILE="content/cluster_content.json"

# 获取集群版本
K8S_VERSION=$(kubectl version | grep "Server" | awk '{print $3}')

# 获取节点数量
NODE_COUNT=$(kubectl get nodes --no-headers | grep -v '^$' | wc -l)

# 将基本信息存入 JSON 对象
JSON_OUTPUT="{\"集群信息\":{\"集群版本\":\"$K8S_VERSION\",\"节点数量\":$NODE_COUNT},\"资源信息\":{"

# 获取命名空间信息
NAMESPACE_NAMES=$(kubectl get namespaces -o custom-columns=:metadata.name)

# 检查 NAMESPACES 是否为空
if [ -z "$NAMESPACE_NAMES" ]; then
    echo "没有找到命名空间。"
    echo "$JSON_OUTPUT" >> "$OUTPUT_FILE"
    exit 0
fi

# 遍历命名空间
for NAMESPACE in $NAMESPACE_NAMES; do
    # 检查命名空间是否有资源，默认为0
    DEPLOYMENT_COUNT=0
    POD_COUNT=0

    # 检查是否有部署
    DEPLOYMENT_INFO=$(kubectl get deployments -n $NAMESPACE --no-headers 2>/dev/null)
    if [ -n "$DEPLOYMENT_INFO" ]; then
        DEPLOYMENT_COUNT=$(echo "$DEPLOYMENT_INFO" | wc -l)
    fi

    # 检查是否有正在运行的 Pod
    POD_COUNT=$(kubectl get pods -n $NAMESPACE --field-selector=status.phase=Running --no-headers 2>/dev/null | wc -l)

    # 创建命名空间的信息 JSON
    DEPLOYMENT_JSON="{\"命名空间\":\"$NAMESPACE\",\"部署数量\":$DEPLOYMENT_COUNT,\"Pod数量\":$POD_COUNT}"

    # 将命名空间信息添加到 JSON 输出
    JSON_OUTPUT+="\"$NAMESPACE\":$DEPLOYMENT_JSON,"
done

# 去掉最后一个逗号并闭合 JSON 对象
JSON_OUTPUT="${JSON_OUTPUT%,}}}"

# 格式化 JSON 输出并保存到文件
echo "$JSON_OUTPUT" | jq . > "$OUTPUT_FILE"

# 提示完成
echo "Generated $OUTPUT_FILE successfully!"
