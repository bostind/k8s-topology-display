#!/bin/bash

# 输出文件名
filelabels="k8s_node_labels_extracted.txt"

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
    "\(.name)  region=\(.region) zone=\(.zone)  rack=\(.rack)  hostname=\(.hostname)"' >> "$filelabels"; then
    echo "Error: Failed to retrieve nodes or process data." >&2
fi
sed -i '/^$/d' "$filelabels"
# 添加文件结束标记
    echo "Output labels saved to $filelabels"

# 输出文件名
filesubgraph="node_subgraph.txt"

# 检查输入文件是否存在
if [[ ! -f "$filelabels" ]]; then
    echo "错误: 输入文件 $filelabels 不存在。" >&2
    exit 1
fi

echo "" > "$filesubgraph"
{
    echo "graph TD"  # 改为 TD 以实现横向排列

    declare -A zone_racks   # 用于跟踪每个 zone 和 rack 的 hostname
    declare -A region_zones  # 用于跟踪每个 region 包含的 zone
    declare -A output_zones  # 用于跟踪已输出的 zone
    declare -A output_racks  # 用于跟踪已输出的 rack

    # 从输入文件中读取内容
    while IFS=", " read -r node region zone rack hostname; do
        # 检查 region、zone、rack 和 hostname 的有效性
        if [[ -n "$region" && -n "$zone" && -n "$rack" && -n "$hostname" ]]; then
            # 合并相同 zone 和 rack
            zone_racks["$zone:$rack"]+="$hostname\n"  # 记录 hostname

            # 记录每个 region 中的 zone
            if [[ -z "${region_zones[$region]}" ]]; then
                region_zones[$region]=""
            fi
            region_zones[$region]+="$zone "
        fi
    done < "$filelabels"

    # 输出合并后的 subgraph
    
    for region in "${!region_zones[@]}"; do
        zones=(${region_zones[$region]})  # 获取该 region 中的所有 zones
        if [[ ${#zones[@]} -gt 0 ]]; then  # 确保 zone 不为空
            echo "        subgraph $region" >> "$filesubgraph.tmp"  # 创建 region 的 subgraph
            
            # 输出 zone 名称
            for zone in "${zones[@]}"; do
                if [[ -z "${output_zones[$zone]}" ]]; then
                    echo "            $zone" >> "$filesubgraph.tmp"  # 输出 zone 名称
                    output_zones[$zone]=1  # 标记为已输出
                fi
            done
            echo "        end" >> "$filesubgraph.tmp"  # 结束 region 的 subgraph
             # 输出 zone 的 subgraph
            output_zones=()
            for zone in "${zones[@]}"; do
                if [[ -z "${output_zones[$zone]}" ]]; then
                    echo "            subgraph $zone" >> "$filesubgraph.tmp"  # 创建 zone 的 subgraph
                    output_zones[$zone]=1  # 标记为已输出
                    
                    # 输出该 zone 下的 racks 和 hostnames
                    for rack_key in "${!zone_racks[@]}"; do
                        if [[ $rack_key == $zone:* ]]; then
                            rack="${rack_key#*:}"  # 提取 rack 名
                            if [[ -z "${output_racks[$rack]}" ]]; then
                                echo "                subgraph $rack" >> "$filesubgraph.tmp"  # 创建 rack 的 subgraph
                                echo -e "${zone_racks[$rack_key]}" >> "$filesubgraph.tmp"  # 输出所有 hostname
                                echo "                end" >> "$filesubgraph.tmp"  # 结束 rack 的 subgraph
                                output_racks[$rack]=1  # 标记为已输出
                            fi
                        fi
                    done
                    
                    echo "            end" >> "$filesubgraph.tmp"  # 结束 zone 的 subgraph
                fi
            done
            
            
        fi
    done
} > "$filesubgraph.tmp" && mv "$filesubgraph.tmp" "$filesubgraph"
sed -i 's/=/:/g' "$filesubgraph"
# 添加文件结束标记
    echo "Output subgraph saved to $filesubgraph"
