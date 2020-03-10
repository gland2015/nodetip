// 代理已手动下载在本地的文件，以便于解决各种安装问题
// 只需配置fileMap.json和信任证书即可，在文件目录启动

const Proxy = require("http-mitm-proxy");
const send = require("send");
const path = require("path");

const port = process.env.PORT || 8081;
const sslCaDir = path.resolve(process.env.HOME || process.env.USERPROFILE, './.http-mitm-proxy');
const fileMap = require(path.join(process.cwd(), "fileMap.json"));
const proxy = Proxy();

proxy.onError(function(ctx, err, errorKind) {});
proxy.onRequest(function(ctx, callback) {
    const request = ctx.clientToProxyRequest;
    const url = (ctx.isSSL ? "https://" : "http://") + request.headers.host + request.url;
    const needProxy = !!fileMap[url];
    console.log("------url--------" + url + "------url--------", needProxy);
    if (needProxy) {
        let filePath;
        if (path.isAbsolute(fileMap[url])) {
            filePath = fileMap[url];
        } else {
            filePath = path.join(process.cwd(), fileMap[url]);
            const response = ctx.proxyToClientResponse;
            const file = send(request, encodeURI(filePath), {});
            file.pipe(response);
            return;
        }
    }
    callback();
});

proxy.listen({ 
  port,
  sslCaDir
});
console.log("listening on " + port);
