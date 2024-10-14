#!/bin/bash

# 文件名
filelabels="k8s_node_labels_extracted.txt"
filesubgraph="pod_subgraph.txt"
pods_info="pods_summary.txt"

# 检查 kubectl 和 jq 是否存在
if ! command -v kubectl &> /dev/null || ! command -v jq &> /dev/null; then
    echo "Error: kubectl or jq is not installed. Please install them and try again."
    exit 1
fi

# 清空或创建输出文件
echo > "$filelabels"

# 获取所有节点的标签并提取需要的字段
if ! kubectl get nodes -o json | jq -r '.items[] | 
    {name: .metadata.name, 
     region: .metadata.labels["region"], 
     zone: .metadata.labels["zone"], 
     rack: .metadata.labels["rack"], 
     hostname: .metadata.labels["hostname"]} | 
    select(.hostname != null or .zone != null or .rack != null or .region != null) | 
    "\(.name)  \(.region) \(.zone)  \(.rack)  \(.hostname)"' >> "$filelabels"; then
    echo "Error: Failed to retrieve nodes or process data." >&2
fi

# 去除空行
sed -i '/^$/d' "$filelabels"
echo "Output labels saved to $filelabels"

# 检查输入文件是否存在
if [[ ! -f "$filelabels" ]]; then
    echo "错误: 输入文件 $filelabels 不存在。" >&2
    exit 1
fi

# 输出文件内容
echo "" > "$filesubgraph"

{
    echo "graph TD"  # 改为 TD 以实现横向排列

    # 数据结构定义
    declare -A zone_racks   # 用于跟踪每个 zone 和 rack 的 hostname
    declare -A region_zones  # 用于跟踪每个 region 包含的 zone
    declare -A added_hosts   # 用于跟踪已添加的主机名
    declare -A added_racks   # 用于跟踪已添加的 rack


    # 从输入文件中读取内容
    while IFS=", " read -r node region zone rack hostname; do
        if [[ -n "$region" && -n "$zone" && -n "$rack" && -n "$hostname" ]]; then
            if [[ -z "${added_hosts[$hostname]}" ]]; then
                zone_racks["$zone:$rack"]+="$hostname "  # 用空格分隔而不是换行
                added_hosts[$hostname]=1  # 标记该主机名已经添加
            fi

            if [[ -z "${region_zones[$region]}" ]]; then
                region_zones[$region]=""
            fi
            region_zones[$region]+="$zone "
        fi
    done < "$filelabels"

    if [[ -f "$pods_info" ]]; then
        while IFS=" " read -r deployment_name pod_name pod_node; do
            pods_info_lines+="$(echo "$deployment_name $pod_name $pod_node")"$'\n'
        done < "$pods_info"
    else
        echo "Error: pods_summary.txt not found." >&2
        exit 1
    fi

    # 输出合并后的 subgraph
    for region in "${!region_zones[@]}"; do
        zones=(${region_zones[$region]})
        if [[ ${#zones[@]} -gt 0 ]]; then
            echo "        subgraph $region" >> "$filesubgraph.tmp"  # 创建 region 的 subgraph
            
            for zone in "${zones[@]}"; do
                echo "            subgraph $zone" >> "$filesubgraph.tmp"  # 创建 zone 的 subgraph

                for rack_key in "${!zone_racks[@]}"; do
                    if [[ $rack_key == $zone:* ]]; then
                        rack="${rack_key#*:}"

                        # 检查是否已经添加过该 rack
                        if [[ -z "${added_racks[$rack]}" ]]; then
                            pod_count=0  # 用于追踪与当前 rack 相关联的 Pods
                            rack_hosts=()  # 用于存储当前 rack 的主机名

                            # 输出 rack 信息，并确保每个主机名与其 Pod 关联
                            for host in ${zone_racks[$rack_key]}; do
                                count=0
                                while IFS= read -r pod; do
                                    deployment_name=$(echo "$pod" | awk '{print $1}')  # 获取 Deployment 名称
                                    pod_name=$(echo "$pod" | awk '{print $2}')  # 获取 Pod 名称
                                    pod_node=$(echo "$pod" | awk '{print $3}')  # 获取 Pod 所在节点
                                    if [[ "$pod_node" == "$host" ]]; then
                                        pod_count=$((pod_count + 1))
                                        count=1
                                        echo "           $deployment_name -.->  $pod_name -.-> $host" >> "$filesubgraph.tmp"  # Pod 连接到节点
                                    fi
                                done <<< "$pods_info_lines"

                                # 只有在有 Pod 时才将主机名添加到数组
                                if [[ $count -gt 0 ]]; then
                                    rack_hosts+=("$host")
                                fi
                            done

                            # 如果当前 rack 有主机名，则输出 subgraph
                            if [[ ${#rack_hosts[@]} -gt 0 ]]; then
                                echo "                subgraph rack:$rack" >> "$filesubgraph.tmp"  # 创建 rack 的 subgraph
                                for rack_host in "${rack_hosts[@]}"; do
                                    echo "                    $rack_host" >> "$filesubgraph.tmp"
                                done
                                echo "                end" >> "$filesubgraph.tmp"  # 结束 rack 的 subgraph
                            fi

                            added_racks[$rack]=1  # 标记该 rack 已添加
                        fi
                    fi
                done

                echo "            end" >> "$filesubgraph.tmp"  # 结束 zone 的 subgraph
            done
            echo "        end" >> "$filesubgraph.tmp"  # 结束 region 的 subgraph
        fi
    done
} > "$filesubgraph.tmp" && mv "$filesubgraph.tmp" "$filesubgraph"
sed -i 's/=/:/g' "$filesubgraph"
echo "Output subgraph saved to $filesubgraph"
