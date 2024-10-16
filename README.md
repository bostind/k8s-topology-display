# 拓扑信息输出展示
1、node拓扑展示效果

![alt text](/images/image01.png "效果图")

2、pod拓扑展示效果

![alt text](/images/image02.png "效果图")

# 使用方式


'''

docker build -t k8stopologyshow:v0.2 .

docker run -d -p 8082:80 k8stopologyshow:v0.2

'''

浏览器访问 http://localhost:8082/

# 待解决问题

k8s集群认证问题

变量灵活定义

自动刷新页面

网页颜色