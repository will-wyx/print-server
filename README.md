# print-server
Electron 启动 http 服务，下载 pdf 并打印

## 使用

### 服务启动测试
```javascript
fetch('http://127.0.0.1:38250/', {method: 'GET'})
```

### 单文件打印
```javascript
fetch('http://127.0.0.1:38250/print/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ url: url })
})
```


### 多文件打印
```javascript
fetch('http://127.0.0.1:38250/printMulti/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ url: [url1, url2, url3] })
})
```

