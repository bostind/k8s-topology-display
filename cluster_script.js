document.addEventListener('DOMContentLoaded', () => {
    const contentDisplay = document.getElementById('cluster-display');

    // 从服务器获取内容
    function fetchContent() {
        fetch('/api/cluster') // 从 serve.js 提供的 API 获取内容
            .then(response => {
                if (!response.ok) {
                    throw new Error('网络响应失败: ' + response.statusText);
                }
                return response.json();

            })
            .then(data => {
                // 设置基本信息
                contentDisplay.querySelector('#cluster-version').textContent = data["基本信息"]["集群版本"];
                contentDisplay.querySelector('#node-count').textContent = data["基本信息"]["节点数量"];
                
                // 生成命名空间表格
                const tbody = contentDisplay.querySelector('#namespace-table tbody');
                tbody.innerHTML = '';
                for (const namespace in data["详细信息"]) {
                    const row = tbody.insertRow();
                    row.insertCell(0).textContent = data["详细信息"][namespace]["命名空间"];
                    row.insertCell(1).textContent = data["详细信息"][namespace]["部署数量"];
                    row.insertCell(2).textContent = data["详细信息"][namespace]["Pod数量"];
                }
            })
            .catch(error => {
                console.error('加载内容时出错:', error);
            });
    }

    // 调用 fetchContent 函数以获取内容
    fetchContent();


    document.getElementById('cluster-info').addEventListener('click', function() {
        fetch('/cluster-info', {
            method: 'POST',
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('执行脚本失败');
            }
            fetchContent()
        })
        .catch(error => {
            console.error('错误:', error);
        });
    });
});
