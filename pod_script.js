document.addEventListener('DOMContentLoaded', () => {
    const contentDisplay = document.getElementById('content-display');
    const deploymentSelect = document.getElementById('deployment-select');

    // 从服务器获取内容的函数
    function fetchDeploymentOptions() {
        fetch('/api/pods') // 从 server.js 提供的 API 获取内容
            .then(response => {
                if (!response.ok) {
                    throw new Error('网络响应不是 OK');
                }
                return response.json();
            })
            .then(data => {
                // 提取所有 deployment_name 并填充到下拉框中
                const deployments = new Set();
                Object.keys(data).forEach(region => {
                    const zones = data[region];
                    Object.keys(zones).forEach(zone => {
                        const racks = zones[zone];
                        Object.keys(racks).forEach(rack => {
                            const hosts = racks[rack];
                            Object.keys(hosts).forEach(hostname => {
                                hosts[hostname].forEach(pod => {
                                    deployments.add(pod.deployment_name);
                                });
                            });
                        });
                    });
                });

                deployments.forEach(deployment => {
                    const option = document.createElement('option');
                    option.value = deployment;
                    option.textContent = deployment;
                    deploymentSelect.appendChild(option);
                });
            })
            .catch(error => console.error('错误:', error));
    }

    // 从服务器获取 Pods 内容并展示
    function fetchContent(deploymentFilter = '') {
        fetch('/api/pods') // 从 server.js 提供的 API 获取内容
            .then(response => {
                if (!response.ok) {
                    throw new Error('网络响应不是 OK');
                }
                return response.json();
            })
            .then(data => {
                // 清空之前的内容
                contentDisplay.innerHTML = '';

                // 遍历区域
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

                                // 如果有 pods，进行展示
                                pods.forEach(pod => {
                                    if (deploymentFilter === "" || pod.deployment_name === deploymentFilter || deploymentFilter === "all") {
                                        const podDiv = document.createElement('div');
                                        podDiv.className = 'pod'; 
                                        podDiv.textContent = pod.pod_name; // 只显示 pod_name
                                        hostnameDiv.appendChild(podDiv);
                                    }
                                });

                                rackDiv.appendChild(hostnameDiv); // 将 hostname 的框添加到机架 div 中
                            });

                            zoneDiv.appendChild(rackDiv); // 添加 rack 到 zone
                        });

                        regionDiv.appendChild(zoneDiv); // 添加 zone 到 region
                    });

                    contentDisplay.appendChild(regionDiv); // 添加 region 到页面
                });
            })
            .catch(error => console.error('错误:', error));
    }

    // 初始加载并填充下拉框
    fetchDeploymentOptions();
    fetchContent(); // 加载内容

    // 刷新按钮
    document.getElementById("run-pod-script").addEventListener("click", () => {
        fetch('/run-pod-script', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                console.log("脚本执行结果:", data);
                fetchContent(); // 重新获取内容
            })
            .catch((error) => {
                console.error("发生错误:", error);
            });

    });

    // 下拉框选择事件
    deploymentSelect.addEventListener('change', () => {
        const selectedDeployment = deploymentSelect.value;
        fetchContent(selectedDeployment); // 根据选择刷新内容
    });
});
