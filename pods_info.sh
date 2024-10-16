pods_info=""

# 获取所有命名空间
namespaces=$(kubectl get namespaces -o jsonpath='{.items[*].metadata.name}')

# 遍历所有命名空间
for namespace in $namespaces; do
    # echo "Processing namespace: $namespace"

    # 自动获取每个命名空间内的所有 Deployment 名称
    deployments=$(kubectl get deployments -n "$namespace" -o jsonpath='{.items[*].metadata.name}')

    # 遍历所有 Deployment
    for deployment_name in $deployments; do
        # 获取与该 Deployment 相关的 ReplicaSet
        replica_sets=$(kubectl get rs -n "$namespace" -o jsonpath='{.items[?(@.metadata.ownerReferences[0].name=="'"$deployment_name"'")].metadata.name}')

        # 遍历每个 ReplicaSet
        for replica_set in $replica_sets; do
            # 获取与ReplicaSet相关的 Pods
            pods=$(kubectl get pods -n "$namespace" -o jsonpath='{.items[?(@.metadata.ownerReferences[0].name=="'"$replica_set"'")].metadata.name}')

            # 如果有 Pods，遍历每个 Pod 获取节点信息
            for pod in $pods; do
                pod_info=$(kubectl get pod "$pod" -n "$namespace" -o jsonpath='{.metadata.name} {"  "}{.spec.nodeName}')
                
                # 确保 pod_info 不为空
                if [[ -n "$pod_info" ]]; then
                    pods_info+="$deployment_name  ""$pod_info"$'\n'  # 添加 Pod 信息并换行
            
                fi
            done
        done
    done
done

# 将汇总信息输出到文件
output_file="/usr/local/bin/pods_summary.txt"
echo -e "$pods_info" > "$output_file"  # 使用 -e 选项确保换行符被正确处理

# 提示用户输出文件位置
echo "Pods summary has been written to $output_file"
