#!/bin/bash

# 首次执行三个脚本
./pods_info.sh  # 首次获取pods信息
./labelstomermaind.sh    # 首次执行标签处理
sleep 30
./labelpod_distribution.sh  # 首次执行标签分布统计

# 然后进入定时循环
while true; do
    ./pods_info.sh  # 定时获取pods信息
    sleep 60 
done &  # 使用后台进程

while true; do
    ./labelstomermaind.sh  # 定时执行标签处理
    sleep 120
done &  # 使用后台进程

while true; do
    ./labelpod_distribution.sh  # 定时执行标签分布统计
    sleep 65
done &  # 使用后台进程

# 等待所有后台进程结束
wait
