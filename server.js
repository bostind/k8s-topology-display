const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const app = express();
const PORT = 3000;

// 使用静态文件服务
app.use(express.static(path.join(__dirname)));

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
app.post('/run-pod-script', (req, res) => {
    exec('sh/pod_distribution.sh', (error, stdout, stderr) => {
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
app.get('/api/pods', (req, res) => {
    fs.readFile('pods_content.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('文件读取失败');
        }
        res.json(JSON.parse(data));
    });
});
// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器正在运行: http://localhost:${PORT}`);
});
