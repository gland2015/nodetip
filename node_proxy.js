// nodejs代理实现代理 用法：node node_proxy

const net = require("net");

const server = net.createServer();

server.on("connection", clientToProxySocket => {
    // We need only the data once, the starting packet
    clientToProxySocket.once("data", data => {
        // If you want to see the packet uncomment below
        let isTLSConnection = data.toString().indexOf("CONNECT") !== -1;

        // By Default port is 80
        let serverPort = 80;
        let serverAddress;
        if (isTLSConnection) {
            // Port changed if connection is TLS
            serverPort = data
                .toString()
                .split("CONNECT ")[1]
                .split(" ")[0]
                .split(":")[1];
            serverAddress = data
                .toString()
                .split("CONNECT ")[1]
                .split(" ")[0]
                .split(":")[0];
        } else {
            serverAddress = data
                .toString()
                .split("Host: ")[1]
                .split("\r\n")[0];
        }

        let proxyToServerSocket;
        
        proxyToServerSocket = net.createConnection(
            {
                host: serverAddress,
                port: serverPort,
                timeout: 30000
            },
            () => {
                if (isTLSConnection) {
                    clientToProxySocket.write("HTTP/1.1 200 OK\r\n\n");
                } else {
                    proxyToServerSocket.write(data);
                }

                clientToProxySocket.pipe(proxyToServerSocket);
                proxyToServerSocket.pipe(clientToProxySocket);
            }
        );

        proxyToServerSocket.on("error", err => {
            end();
        });

        proxyToServerSocket.on("timeout", err => {
            end();
        });

        clientToProxySocket.on("timeout", err => {
            end();
        });

        clientToProxySocket.on("error", err => {
            end();
        });
        function end() {
            clientToProxySocket.end();
            proxyToServerSocket.end();
        }
    });
});

server.on("error", err => {
    throw err;
});

server.on("close", () => {
});

const port = process.env.PORT || 8124;
server.listen(port, () => {
    console.log("Server runnig at http://localhost:" + port);
});
