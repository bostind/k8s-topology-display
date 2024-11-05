#!/bin/bash

# 输出的 JSON 文件名
output_file="content/namespaces_content.json"

# 获取所有命名空间信息
namespaces=$(kubectl get namespaces -o json)

# 初始化一个数组来存储命名空间和对应的 Deployments
namespace_array=()

# 使用 jq 提取每个命名空间的信息
for namespace in $(echo "$namespaces" | jq -r '.items[].metadata.name'); do
    # 获取该命名空间下的所有 Deployments
    deployments=$(kubectl get deployments --namespace="$namespace" -o json)

    # 获取 Deployment 名称
    deployment_names=()

    for deployment in $(echo "$deployments" | jq -r '.items[].metadata.name'); do
        if [[ -z "$deployment" ]]; then
          echo "No deployments found in namespace: $namespace"
         continue
       fi
       
       deployment_names+=($deployment)
    done

    if [ ${#deployment_names[@]} -gt 0 ]; then
        namespace_array+=("{\"namespace\": \"$namespace\", \"deployments\": [$(printf '"%s",' "${deployment_names[@]}" | sed 's/,$//')]}") 
    fi

done

# 将命名空间信息数组转为 JSON 格式
namespace_json_array=$(printf ",%s" "${namespace_array[@]}")
namespace_json_array="[${namespace_json_array:1}]"  # 清理前面的逗号并生成 JSON 数组

# 输出到文件

final_output=$(echo "$namespace_json_array" | jq '.')

echo "$final_output" > "$output_file"

echo "Generated $output_file successfully!"
