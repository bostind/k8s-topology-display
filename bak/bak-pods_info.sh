#!/bin/bash

# 输出的 JSON 文件名
output_file="pods_content.json"

# 临时文件用于存储 json_output
temp_file=$(mktemp)

# 获取所有节点的标签，并检查是否成功
nodes=$(kubectl get nodes -o json 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "Error: Failed to get nodes information."
    exit 1
fi

# 初始化一个空的 JSON 对象
json_output='{ }'
echo "$json_output" > "$temp_file"  # 将初始化的 JSON 内容写入临时文件

# 提取每个节点的信息
echo "$nodes" | jq -c '.items[]' | while IFS= read -r node; do
    hostname=$(echo "$node" | jq -r '.metadata.name')
    labels=$(echo "$node" | jq -r '.metadata.labels // {}')

    # 提取 region、zone 和 rack 标签，缺失则使用 "unknown"
    region=$(echo "$labels" | jq -r '.region // "unknown"')
    zone=$(echo "$labels" | jq -r '.zone // "unknown"')
    rack=$(echo "$labels" | jq -r '.rack // "unknown"')

    # 创建 JSON 结构并更新到临时文件
    json_output=$(cat "$temp_file" | jq --arg region "$region" \
                                    --arg zone "$zone" \
                                    --arg rack "$rack" \
                                    --arg hostname "$hostname" \
                                    '.[$region] //= {} |
                                     .[$region][$zone] //= {} |
                                     .[$region][$zone][$rack] //= [] |
                                     .[$region][$zone][$rack] += [{hostname: $hostname}]')
    
    echo "$json_output" > "$temp_file"  # 将更新后的 json_output 写入临时文件

done 

# 添加 Pod 信息
namespaces=$(kubectl get namespaces -o jsonpath='{.items[*].metadata.name}')
echo "Available namespaces: $namespaces"
read -p "Please enter the namespace to fetch pods from: " selected_namespace

pods=$(kubectl get pods -n "$selected_namespace" -o json 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "Error: Failed to get pods information."
    exit 1
fi

echo "$pods" | jq -c '.items[]' | while IFS= read -r pod; do
    pod_name=$(echo "$pod" | jq -r '.metadata.name')

    # 假设 Pod 可能没有 region、zone、rack 标签，将其设定为 "unknown"
    pod_region=$(echo "$pod" | jq -r '.metadata.labels.region // "unknown"')
    pod_zone=$(echo "$pod" | jq -r '.metadata.labels.zone // "unknown"')
    pod_rack=$(echo "$pod" | jq -r '.metadata.labels.rack // "unknown"')

    # 更新 JSON 结构以包含 Pod 信息
    json_output=$(cat "$temp_file" | jq --arg pod_name "$pod_name" \
                                    --arg pod_region "$pod_region" \
                                    --arg pod_zone "$pod_zone" \
                                    --arg pod_rack "$pod_rack" \
                                    --arg hostname "$hostname" \
                                    '.[$pod_region] //= {} |
                                     .[$pod_region][$pod_zone] //= {} |
                                     .[$pod_region][$pod_zone][$pod_rack] //= [] |
                                     .[$pod_region][$pod_zone][$pod_rack] += [{pod_name: $pod_name, hostname: $hostname}]')
    
    echo "$json_output" > "$temp_file"  # 将更新后的 json_output 写入临时文件

done 

# 当循环结束后读取临时文件的内容
final_json_output=$(cat "$temp_file")

# 最终优化 JSON 输出格式
final_output=$(echo "$final_json_output" | jq '.')

# 将结果写入输出文件
echo "$final_output" > "$output_file"

# 检查文件写入是否成功
if [ $? -eq 0 ]; then
    echo "Generated $output_file successfully!"
else
    echo "Error: Failed to write to $output_file."
    exit 1
fi

# 删除临时文件
rm -f "$temp_file"
