#!/bin/bash

# 进入定时循环
while true; do
    /usr/local/bin/pods_info.sh  # 定时获取pods信息
    sleep 60 
done &  # 使用后台进程

while true; do
    /usr/local/bin/labelstomermaind.sh  # 定时执行标签处理
    sleep 120
done &  # 使用后台进程

while true; do
    /usr/local/bin/labelpod_distribution.sh  # 定时执行标签分布统计
    sleep 65
done &  # 使用后台进程

# 等待所有后台进程结束
wait
