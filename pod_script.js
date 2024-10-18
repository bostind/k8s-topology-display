document.addEventListener('DOMContentLoaded', () => {
    const contentDisplay = document.getElementById('content-display');
    const deploymentSelect = document.getElementById('deployment-select');

    // 从服务器获取内容的函数
    function fetchContent() {
        fetch('/api/pods') // 从 server.js 提供的 API 获取内容
            .then(response => response.json())
            .then(data => {
                populateDeploymentSelect(data);
                displayPods(data);
            })
            .catch(error => console.error('错误:', error));
    }

    // 填充下拉框
    function populateDeploymentSelect(data) {
        const deployments = new Set();

        // 提取所有 deployment_name
        Object.values(data).forEach(region =>
            Object.values(region).forEach(zone =>
                Object.values(zone).forEach(rack =>
                    Object.keys(rack).forEach(hostname =>
                        rack[hostname].forEach(pod => {
                            if (pod.deployment_name) {
                                deployments.add(pod.deployment_name);
                            }
                        })
                    )
                )
            )
        );

        deploymentSelect.innerHTML = '<option value="">选择 Deployment</option>'; // 初始化默认选项
        deployments.forEach(deployment => {
            const option = document.createElement('option');
            option.value = deployment;
            option.textContent = deployment;
            deploymentSelect.appendChild(option);
        });
    }

    // 根据选择展示 Pod 信息
    deploymentSelect.addEventListener('change', () => {
        fetch('/api/pods')
            .then(response => response.json())
            .then(data => {
                const selectedDeployment = deploymentSelect.value;
                if (selectedDeployment) {
                    displayPods(data, selectedDeployment);
                } else {
                    displayPods(data);
                }
            })
            .catch(error => console.error('错误:', error));
    });

    // 根据指定的 deployment_name 展示 Pods（如果未指定则展示所有）
    function displayPods(data, filterDeployment = '') {
        contentDisplay.innerHTML = '';

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
                        const hostnameDiv = document.createElement('div');
                        hostnameDiv.className = 'hostname-container';
                        hostnameDiv.innerHTML = `<strong>${hostname}</strong>`;

                        pods.forEach(pod => {
                            if (!filterDeployment || pod.deployment_name === filterDeployment) {
                                const podDiv = document.createElement('div');
                                podDiv.className = 'pod';
                                podDiv.textContent = pod.pod_name;
                                hostnameDiv.appendChild(podDiv);
                            }
                        });

                        rackDiv.appendChild(hostnameDiv);
                    });

                    zoneDiv.appendChild(rackDiv);
                });

                regionDiv.appendChild(zoneDiv);
            });

            contentDisplay.appendChild(regionDiv);
        });
    }

    // 调用函数以首次加载内容
    fetchContent();

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
});
