#!/bin/bash
# 获取命名空间参数，默认为 "default"
NAMESPACENAME=${1:-default}
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

    # 在 pod_distribution.sh 中
    pods=$(kubectl get pods --namespace="$NAMESPACENAME" --field-selector spec.nodeName="$hostname",status.phase=Running -o json)
    
    if [ $? -ne 0 ]; then
        echo "Error: Failed to get pods information for node $hostname."
        continue
    fi
    
    # 使用 jq 提取 pod 信息
    mapfile -t pod_lines < <(echo "$pods" | jq -c '.items[]')
    
    # 初始化 Pod 数组
    pod_array=()
    
    for pod in "${pod_lines[@]}"; do
        pod_name=$(echo "$pod" | jq -r '.metadata.name')
        namespace=$(echo "$pod" | jq -r '.metadata.namespace')
        rs_name=$(echo "$pod" | jq -r '.metadata.ownerReferences[] | select(.kind == "ReplicaSet") | .name // empty')
    if [[ -n "$rs_name" ]]; then
        # 在这里添加检查 ReplicaSet 是否存在的逻辑
        deployment_name=$(kubectl get ReplicaSet "$rs_name" --namespace="$NAMESPACENAME"  -o json | jq -r '.metadata.ownerReferences[] | select(.kind == "Deployment") | .name // empty')
    else
        deployment_name="unknown"
    fi

        pod_array+=("{\"pod_name\": \"$pod_name\", \"hostname\": \"$hostname\", \"namespace\": \"$NAMESPACENAME\", \"deployment_name\": \"$deployment_name\"}")
    done
    
    # 将 Pod 信息数组转为 JSON 格式
    pod_json_array=$(printf ",%s" "${pod_array[@]}")
    pod_json_array="[${pod_json_array:1}]"  # 清理前面的逗号并生成 JSON 数组
    # 创建 JSON 结构并更新到临时文件
    json_output=$(cat "$temp_file" | jq --arg region "$region" \
                                        --arg zone "$zone" \
                                        --arg rack "$rack" \
                                        --arg hostname "$hostname" \
                                        --argjson pods "$pod_json_array" \
                                    '.[$region] //= {} |
                                     .[$region][$zone] //= {} |
                                     .[$region][$zone][$rack] //= {} |
                                     .[$region][$zone][$rack][$hostname] //= {} |                                 
                                     .[$region][$zone][$rack][$hostname] = $pods')
                                    

    
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
