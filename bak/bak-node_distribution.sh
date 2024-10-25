#!/bin/bash

# 输出的 JSON 文件名
output_file="content.json"

# 初始化 JSON 格式
{
    echo "{"
    echo "  \"nodes\": {"
    
    # 获取所有节点的标签，并检查是否成功
    nodes=$(kubectl get nodes -o json 2>/dev/null)
    if [ $? -ne 0 ]; then
        echo "Error: Failed to get nodes information."
        exit 1
    fi

    # 提取每个节点的信息
    echo "$nodes" | jq -c '.items[]' | while IFS= read -r node; do
        hostname=$(echo "$node" | jq -r '.metadata.name')
        labels=$(echo "$node" | jq -r '.metadata.labels')

        # 提取 region、zone 和 rack 标签，如果缺失则使用 "unknown"
        region=$(echo "$labels" | jq -r '.region // "unknown"')
        zone=$(echo "$labels" | jq -r '.zone // "unknown"')
        rack=$(echo "$labels" | jq -r '.rack // "unknown"')

        # 组织数据
        echo "    \"$region\": {"
        echo "      \"$zone\": {"
        echo "        \"$rack\": [{"
        echo "          \"hostname\": \"$hostname\""
        echo "        }]"
        echo "      }"
        echo "    },"
    done | sed '$ s/,$//'  # 移除最后一个逗号

    echo "  }"
    echo "}"
} > "$output_file"

if [ $? -eq 0 ]; then
    echo "Generated $output_file successfully!"
else
    echo "Error: Failed to write to $output_file."
    exit 1
fi
