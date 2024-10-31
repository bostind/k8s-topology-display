const data = [
    {
        "namespace": "default",
        "deployments": [
            "nginx-deployment01",
            "nginx-deployment02"
        ]
    },
    {
        "namespace": "kube-system",
        "deployments": [
            "calico-kube-controllers",
            "coredns",
            "metrics-server"
        ]
    },
    {
        "namespace": "test0001",
        "deployments": [
            "nginx-deployment01"
        ]
    }
];

let selectedNamespace = 'default';
let selectedDeployment = 'nginx-deployment01';

// 初始加载时自动展示 Pods 列表
window.onload = function() {
    updateDeploymentOptions();
    updatePodList();
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

// 监听命名空间选择的变化
document.querySelectorAll('.namespace').forEach(item => {
    item.addEventListener('click', function() {
        selectedNamespace = this.getAttribute('data-value');
        updateDeploymentOptions();
        updatePodList();

        // 更新选中的样式
        document.querySelectorAll('.namespace').forEach(ns => {
            ns.classList.remove('selected');
        });
        this.classList.add('selected'); // 给当前选中项添加 selected 类
    });
});

// 更新 Pods 列表的函数
function updatePodList() {
    const podList = document.getElementById('podList');
    podList.innerHTML = ''; // 清空当前的 Pod 列表

    // 模拟获取 Pods 数据
    let pods = [];
    if (selectedNamespace === 'default') {
        pods = selectedDeployment === 'nginx-deployment01' ? ['pod1-nginx-deployment01', 'pod2-nginx-deployment01'] : ['pod1-nginx-deployment02'];
    } else if (selectedNamespace === 'kube-system') {
        if (selectedDeployment === 'calico-kube-controllers') {
            pods = ['pod1-calico-kube-controllers'];
        } else if (selectedDeployment === 'coredns') {
            pods = ['pod1-coredns', 'pod2-coredns'];
        } else if (selectedDeployment === 'metrics-server') {
            pods = ['pod1-metrics-server'];
        }
    } else if (selectedNamespace === 'test0001') {
        pods = selectedDeployment === 'nginx-deployment01' ? ['pod1-nginx-deployment01'] : [];
    }

    // 显示 Pods
    pods.forEach(pod => {
        const li = document.createElement('li');
        li.textContent = pod;
        podList.appendChild(li);
    });
}
