let data = [];
let podData = {};
let selectedNamespace = 'default';
let selectedDeployment = 'nginx-deployment01';

// 页面加载时获取命名空间、部署数据，以及 Pods 数据
window.onload = function() {
    fetch('namespaces_content.json')
        .then(response => response.json())
        .then(jsonData => {
            data = jsonData; // 保存获取到的命名空间和部署数据
            return fetch('pods_content.json'); // 再次请求 pods_content.json
        })
        .then(response => response.json())
        .then(jsonData => {
            podData = jsonData; // 保存获取到的 Pods 数据
            // 调试：打印获取到的数据
            console.log('Namespaces Data:', data);
            console.log('Pods Data:', podData);
            updateNamespaceOptions(); // 更新命名空间选项
            updateDeploymentOptions(); // 更新部署选项
            updatePodList(); // 更新 Pods 列表
        })
        .catch(error => console.error('Error loading data:', error));
}


// 更新命名空间选项的函数
function updateNamespaceOptions() {
    const namespaceOptions = document.getElementById('namespaceOptions');
    namespaceOptions.innerHTML = ''; // 清空当前的命名空间选项

    data.forEach(ns => {
        const div = document.createElement('div');
        div.className = 'namespace';
        div.textContent = ns.namespace;
        div.dataset.value = ns.namespace;

        // 监听命名空间选项的点击事件
        div.addEventListener('click', function() {
            console.log('Selected Namespace:', this.getAttribute('data-value')); // 打印选中的命名空间
            selectedNamespace = this.getAttribute('data-value');
            updateDeploymentOptions();
            updatePodList();

            // 更新选中的样式
            document.querySelectorAll('.namespace').forEach(ns => {
                ns.classList.remove('selected');
            });
            this.classList.add('selected'); // 给当前选中项添加 selected 类
        });

        namespaceOptions.appendChild(div);
    });
}

// 更新部署选项的函数
function updateDeploymentOptions() {
    const deploymentOptions = document.getElementById('deploymentOptions');
    deploymentOptions.innerHTML = ''; // 清空当前的部署选项

    // 从数据源提取当前选中命名空间的部署
    const currentNamespace = data.find(ns => ns.namespace === selectedNamespace);
    if (currentNamespace) {
        currentNamespace.deployments.forEach(deployment => {
            const div = document.createElement('div');
            div.className = 'deployment';
            div.textContent = deployment;
            div.dataset.value = deployment;

            // 监听部署选项的点击事件
            div.addEventListener('click', function() {
                selectedDeployment = this.getAttribute('data-value');
                updatePodList();

                // 更新选中的样式
                document.querySelectorAll('.deployment').forEach(deployment => {
                    deployment.classList.remove('selected');
                });
                this.classList.add('selected'); // 给当前选中项添加 selected 类
            });

            deploymentOptions.appendChild(div);
        });
    }
}

// 更新 Pods 列表的函数
function updatePodList() {
    const podList = document.getElementById('podList');
    podList.innerHTML = ''; // 清空当前的 Pod 列表

    // 从 pods_content.json 中获取与当前命名空间和部署对应的 Pods
    const pods = [];
    if (podData[selectedNamespace]) {
        for (const region in podData[selectedNamespace]) {
            if (podData[selectedNamespace][region]) {
                for (const zone in podData[selectedNamespace][region]) {
                    const nodes = podData[selectedNamespace][region][zone];
                    for (const node in nodes) {
                        if (nodes.hasOwnProperty(node)) {
                            const podListItems = nodes[node];
                            podListItems.forEach(item => {
                                if (item.deployment_name === selectedDeployment) {
                                    pods.push(item.pod_name);
                                }
                            });
                        }
                    }
                }
            }
        }
    }

    // 显示 Pods
    pods.forEach(pod => {
        const li = document.createElement('li');
        li.textContent = pod;
        podList.appendChild(li);
    });
}
