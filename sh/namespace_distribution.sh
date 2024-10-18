#!/bin/bash

# 输出的 JSON 文件名
output_file="namespaces_content.json"

# 获取所有命名空间信息
namespaces=$(kubectl get namespaces -o json)

# 初始化命名空间数组
namespace_array=()

# 使用 jq 提取每个命名空间的信息
for namespace in $(echo "$namespaces" | jq -r '.items[].metadata.name'); do
    # 存储命名空间，格式为 JSON
    namespace_array+=("{\"namespace\": \"$namespace\"}")
done

# 将命名空间信息数组转为 JSON 格式
namespace_json_array=$(printf ",%s" "${namespace_array[@]}")
namespace_json_array="[${namespace_json_array:1}]"  # 清理前面的逗号并生成 JSON 数组

# 输出到文件
echo "$namespace_json_array" | jq . > "$output_file"  # 使用 jq 格式化并输出

echo "Generated $output_file successfully!"
