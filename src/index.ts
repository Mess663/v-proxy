import http, { IncomingMessage, RequestListener } from 'http';
import net from 'net';
import stream from 'stream';
import url from 'url';

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

const connect = (cReq: IncomingMessage, cSock: stream.Duplex) => {
    var u = url.parse('http://' + cReq.url);

        console.log(cReq.url)
    if (!u.port || !u.hostname) return;

    var pSock = net.connect(Number(u.port), u.hostname, function() {
        cSock.write('HTTP/1.1 200 Connection Established\r\n\r\n');
        pSock.pipe(cSock);
    }).on('error', function(e) {
        cSock.end();
    });

    cSock.pipe(pSock);
}

const port = 8080;
http.createServer()
    .on('request', request)
    .on('connect', connect)
    .listen(8080, '0.0.0.0', () => console.log(`代理启动成功，监听0.0.0.0:${port}`));