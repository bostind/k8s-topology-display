const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const app = express();
const PORT = 3000;

// 使用静态文件服务
app.use(express.static(path.join(__dirname)));

function runScripts() {
    exec('sh/namespace_distribution.sh', (error, stdout, stderr) => {
        if (error) {
            console.error(`执行 namespace 脚本错误: ${error.message}`);
        }
        if (stderr) {
            console.error(`namespace 脚本错误输出: ${stderr}`);
        } else {
            console.log(`namespace 脚本输出: ${stdout}`);
        }
    });

    exec('sh/node_distribution.sh', (error, stdout, stderr) => {
        if (error) {
            console.error(`执行节点脚本错误: ${error.message}`);
        }
        if (stderr) {
            console.error(`节点脚本错误输出: ${stderr}`);
        } else {
            console.log(`节点脚本输出: ${stdout}`);
        }
    });

    exec('sh/pod_distribution.sh', (error, stdout, stderr) => {
        if (error) {
            console.error(`执行 Pod 脚本错误: ${error.message}`);
        }
        if (stderr) {
            console.error(`Pod 脚本错误输出: ${stderr}`);
        } else {
            console.log(`Pod 脚本输出: ${stdout}`);
        }
    });
}

// 运行节点脚本的 API
app.post('/run-node-script', (req, res) => {
    exec('sh/node_distribution.sh', (error, stdout, stderr) => {
        if (error) {
            console.error(`执行错误: ${error.message}`);
            return res.status(500).json({ error: error.message });
        }
        if (stderr) {
            console.error(`错误输出: ${stderr}`);
            return res.status(500).json({ error: stderr });
        }
        console.log(stdout);
        res.json({ output: stdout });
    });
});
app.get('/api/nodes', (req, res) => {
    fs.readFile('nodes_content.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('文件读取失败');
        }
        res.json(JSON.parse(data));
    });
});
// 运行 Pod 脚本的 API
app.post('/run-pod-script', express.json(), (req, res) => {
    const namespace = req.body.namespace || 'default'; // 获取传入的命名空间参数
    exec(`sh/pod_distribution.sh ${namespace}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`执行错误: ${error.message}`);
            return res.status(500).json({ error: error.message });
        }
        if (stderr) {
            console.error(`错误输出: ${stderr}`);
            return res.status(500).json({ error: stderr });
        }
        console.log(stdout);
        res.json({ output: stdout });
    });
});

// 获取 Pods 内容的 API，根据命名空间过滤
app.get('/api/pods', (req, res) => {
    fs.readFile('pods_content.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('文件读取失败');
        }

        // 直接返回读取到的内容，无需筛选
        res.json(JSON.parse(data)); // 返回 JSON 格式的 Pods 数据
    });
});


// 获取命名空间内容的 API
app.get('/api/namespaces', (req, res) => {
    fs.readFile('namespaces_content.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('文件读取失败');
        }
        res.json(JSON.parse(data));
    });
});
// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器正在运行: http://localhost:${PORT}`);
    runScripts();
});
