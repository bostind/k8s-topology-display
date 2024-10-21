document.addEventListener('DOMContentLoaded', () => {
    const contentDisplay = document.getElementById('content-display');
    const namespaceSelect = document.getElementById('namespace-select');
    const deploymentSelect = document.getElementById('deployment-select');

    // 从服务器获取命名空间的函数
    function fetchNamespaces() {
        fetch('/api/namespaces') // 从 server.js 提供的 API 获取命名空间内容
            .then(response => {
                if (!response.ok) {
                    throw new Error('网络响应不是 OK');
                }
                return response.json();
            })
            .then(data => {
                // 填充命名空间选择框
                data.forEach(namespace => {
                    const option = document.createElement('option');
                    option.value = namespace.namespace; // 设置值为命名空间名称
                    option.textContent = namespace.namespace; // 显示命名空间名称
                    namespaceSelect.appendChild(option); // 添加到下拉框中
                });
                fetchContent(namespaceSelect.value); // 默认获取选中的命名空间内容
            })
            .catch(error => console.error('错误:', error));
    }

    // 获取 Pods 内容并展示
    function fetchContent(namespace) {
        fetch(`/api/pods?namespace=${namespace}`) // 传递选择的命名空间
            .then(response => {
                if (!response.ok) {
                    throw new Error('网络响应不是 OK');
                }
                return response.json();
            })
            .then(data => {
                // 清空之前的内容
                contentDisplay.innerHTML = '';
                deploymentSelect.innerHTML = '<option value="">选择 Deployment</option><option value="all">全部展示</option>'; // 清空部署下拉框

                const deployments = new Set(); // 存储该命名空间下的 Deployments

                // 遍历 Pods 数据
                Object.keys(data).forEach(region => {
                    const regionDiv = document.createElement('div');
                    regionDiv.className = 'region-container';
                    regionDiv.innerHTML = `<h2>${region}</h2>`;

                    const zones = data[region];
                    Object.keys(zones).forEach(zone => {
                        const zoneDiv = document.createElement('div');
                        zoneDiv.className = 'zone-container';
                        zoneDiv.innerHTML = `<h3>${zone}</h3>`;

                        const racks = zones[zone];
                        Object.keys(racks).forEach(rack => {
                            const rackDiv = document.createElement('div');
                            rackDiv.className = 'rack-container';
                            rackDiv.innerHTML = `<h4>${rack}</h4>`;

                            const hosts = racks[rack];
                            Object.keys(hosts).forEach(hostname => {
                                const pods = hosts[hostname];

                                // 创建一个框线显示 hostname
                                const hostnameDiv = document.createElement('div');
                                hostnameDiv.className = 'hostname-container';
                                hostnameDiv.innerHTML = `<strong>${hostname}</strong>`; // 显示 hostname

                                pods.forEach(pod => {
                                    const podDiv = document.createElement('div');
                                    podDiv.className = 'pod'; // 添加对应的样式
                                    podDiv.textContent = pod.pod_name; // 只显示 pod_name
                                    hostnameDiv.appendChild(podDiv); // 将 pod 放入 hostname 的框中

                                    // 存储 Deployment 名称
                                    deployments.add(pod.deployment_name);
                                });

                                rackDiv.appendChild(hostnameDiv); // 将 hostname 的框添加到机架 div 中
                            });

                            zoneDiv.appendChild(rackDiv); // 添加 rack 到 zone
                        });

                        regionDiv.appendChild(zoneDiv); // 添加 zone 到 region
                    });

                    contentDisplay.appendChild(regionDiv); // 添加 region 到页面
                });

                // 填充 Deployment 选择框
                deployments.forEach(deployment => {
                    const option = document.createElement('option');
                    option.value = deployment; // 设置值为 Deployment 名称
                    option.textContent = deployment; // 显示 Deployment 名称
                    deploymentSelect.appendChild(option); // 添加到 Deployment 下拉框
                });
            })
            .catch(error => console.error('错误:', error));
    }

    // 初始加载命名空间
    fetchNamespaces();

    // 刷新按钮处理
    // 刷新按钮处理
    document.getElementById("run-pod-script").addEventListener("click", () => {
        const selectedNamespace = namespaceSelect.value; // 获取选中的命名空间
        fetch('/run-pod-script', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' // 设置请求头
            },
            body: JSON.stringify({ namespace: selectedNamespace }) // 传递命名空间参数
        })
        .then(response => response.json())
        .then(data => {
            console.log("脚本执行结果:", data);
            fetchPods(selectedNamespace); // 重新获取内容并更新显示
            // 不需要使用 location.reload(); 
        })
        .catch((error) => {
            console.error("发生错误:", error);
        });
    });


    // 选择命名空间后重新加载 Pods 数据
    namespaceSelect.addEventListener('change', () => {
        fetchContent(namespaceSelect.value); // 根据选择刷新内容
    });

    // 选择 Deployment 后更新展示
    deploymentSelect.addEventListener('change', () => {
        const selectedDeployment = deploymentSelect.value;
        fetchContent(namespaceSelect.value, selectedDeployment); // 根据选择刷新内容，传递命名空间和 Deployment
    });
});
