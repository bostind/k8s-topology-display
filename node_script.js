document.addEventListener('DOMContentLoaded', () => {
    const contentDisplay = document.getElementById('content-display');

    // 从服务器获取内容
    function fetchContent() {
        fetch('/api/nodes') // 从 serve.js 提供的 API 获取内容
            .then(response => response.json())
            .then(data => {
                // 获取所有区域
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

                        const racks = zones[zone];
                        Object.keys(racks).forEach(rack => {
                            const rackDiv = document.createElement('div');
                            rackDiv.className = 'rack-container';
                            rackDiv.innerHTML = `<h3>${rack}</h3>`;

                            racks[rack].forEach(node => {
                                const nodeDiv = document.createElement('div');
                                nodeDiv.className = 'node';
                                nodeDiv.textContent = node.hostname;
                                rackDiv.appendChild(nodeDiv);
                            });

                            zoneDiv.appendChild(rackDiv);
                        });

                        regionDiv.appendChild(zoneDiv);
                    });

                    contentDisplay.appendChild(regionDiv);
                });
            })
            .catch(error => console.error('错误:', error));
    }

    fetchContent();
});