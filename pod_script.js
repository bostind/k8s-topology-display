document.addEventListener('DOMContentLoaded', () => {
    const contentDisplay = document.getElementById('content-display');

    // 从服务器获取内容的函数
    function fetchContent() {
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
                    regionDiv.innerHTML = `<h1>${region}</h1>`;

                    // 获取区
                    const zones = data[region];
                    Object.keys(zones).forEach(zone => {
                        const zoneDiv = document.createElement('div');
                        zoneDiv.className = 'zone-container';
                        zoneDiv.innerHTML = `<h2>${zone}</h2>`;

                        // 遍历 rack
                        const racks = zones[zone];
                        Object.keys(racks).forEach(rack => {
                            const rackDiv = document.createElement('div');
                            rackDiv.className = 'rack-container';
                            rackDiv.innerHTML = `<h3>${rack}</h3>`;

                            // 获取对应的主机名及其下的 pods
                            const hosts = racks[rack];
                            Object.keys(hosts).forEach(hostname => {
                                const pods = hosts[hostname];
                                
                                // 创建一个框线显示 hostname
                                const hostnameDiv = document.createElement('div');
                                hostnameDiv.className = 'hostname-container';
                                hostnameDiv.innerHTML = `<strong>${hostname}</strong>`; // 显示 hostname

                                // 如果有 pods，进行展示
                                if (pods.length > 0) {
                                    pods.forEach(pod => {
                                        const podDiv = document.createElement('div');
                                        podDiv.className = 'pod'; // 可以添加相应的样式
                                        podDiv.textContent = pod.pod_name; // 只显示 pod_name
                                        hostnameDiv.appendChild(podDiv); // 将 pod 放入 hostname 的框中
                                    });
                                } else {
                                    const noPodsDiv = document.createElement('div');
                                    noPodsDiv.textContent = 'No Pods available'; // 当没有 Pods 时的提示
                                    hostnameDiv.appendChild(noPodsDiv);
                                }

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

    // 调用函数以首次加载内容
    fetchContent();

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
});
