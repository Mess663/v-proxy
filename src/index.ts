import http, { IncomingMessage, RequestListener } from 'http';
import net from 'net';
import stream from 'stream';
import url from 'url';
import { createFakeHttpsWebSite } from './create_fake_https';

const request: RequestListener  = (cReq, cRes) => {
    if (!cReq.url) return;

    var u = url.parse(cReq.url);

    var options = {
        hostname : u.hostname, 
        port     : u.port || 80,
        path     : u.path,       
        method     : cReq.method,
        headers     : cReq.headers
    };

    var pReq = http.request(options, function(pRes) {
        cRes.writeHead(pRes.statusCode || 500, pRes.headers);
        pRes.pipe(cRes);
    }).on('error', function(e) {
        cRes.end();
    });

    cReq.pipe(pReq);
}

const connect = (cReq: IncomingMessage, cltSocket: stream.Duplex, head) => {
    var u = url.parse('http://' + cReq.url);

    if (!u.port || !u.hostname) return;

    createFakeHttpsWebSite(u.hostname, (port) => {
        var srvSocket = net.connect(port, '127.0.0.1', () => {
            cltSocket.write('HTTP/1.1 200 Connection Established\r\n' +
                            'Proxy-agent: MITM-proxy\r\n' +
                            '\r\n');
            srvSocket.write(head);
            srvSocket.pipe(cltSocket);
            cltSocket.pipe(srvSocket);
        });
        srvSocket.on('error', (e) => {
            console.error(e);
        });
  })

    // var pSock = net.connect(Number(u.port), u.hostname, function() {
    //     cSock.write('HTTP/1.1 200 Connection Established\r\n\r\n');
    //     pSock.pipe(cSock);
    // }).on('error', function(e) {
    //     cSock.end();
    // });

    // cSock.pipe(pSock);
}

const port = 8080;
http.createServer()
    .on('request', request)
    .on('connect', connect)
    .listen(8080, '0.0.0.0', () => console.log(`代理启动成功，监听0.0.0.0:${port}`));

