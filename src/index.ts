import http, { IncomingMessage, RequestListener } from 'http';
import net from 'net';
import ip from 'ip';
import stream from 'stream';
import url from 'url';
import { createFakeHttpsWebSite } from './https_proxy';
import Koa from 'koa';
import staticCache from 'koa-static-cache'
import route from 'koa-route';
import websockify from 'koa-websocket';
import cors from 'koa2-cors';
import path from 'path';
import staticServe from "koa-static";
import router from './route';
import { uniqueId } from 'lodash';

let wsInstance: any = null

const request = (cReq: http.IncomingMessage, cRes: http.ServerResponse) => {
    if (!cReq.url) return;

    var u = url.parse(cReq.url);

    var options = {
        hostname : u.hostname, 
        port     : (u.port || 80),
        path     : u.path,       
        method     : cReq.method,
        headers     : cReq.headers
    };

    var pReq = http.request(options, function(pRes) {
        cRes.writeHead(pRes.statusCode || 500, pRes.headers);
        pRes.pipe(cRes);

        let data = ''
        pRes.on("data", (chunk) => {
            data = data + chunk.toString();
        })

        if (wsInstance) {
            pRes.on("end", ()=> {
                wsInstance.send(JSON.stringify({
                    id: uniqueId(),
                    req: options,
                    res: {
                        statusCode: pRes.statusCode,    
                        data,
                        ...pRes.headers,
                    }
                }))
            })
        }
    }).on('error', function(e) {
        cRes.end();
    });

    cReq.pipe(pReq);
}

const connect = (cReq: IncomingMessage, cltSocket: stream.Duplex, head) => {
    var u = url.parse('http://' + cReq.url);

    if (!u.port || !u.hostname) return;

    createFakeHttpsWebSite(u.hostname, (port: number) => {
        var srvSocket = net.connect(port, '127.0.0.1', () => {
            cltSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
            srvSocket.write(head);
            srvSocket.pipe(cltSocket);
            cltSocket.pipe(srvSocket);
        });
        srvSocket.on('error', (e) => {
            console.error(e);
        });
    }, wsInstance)
}

const setWebSocketServer = () => {
    const app = websockify(new Koa(), {});
    app.ws.use(route.all('/proxy', function (ctx) {
        wsInstance = ctx.websocket        

        ctx.websocket.on("error", (err) => {
            console.log('ERROR: ', err)
            ctx.websocket.terminate()
            setWebSocketServer()
        })
    }));
    app.listen(82)
}

const setWebServer = () => {
    const app = new Koa();

    // app.use(staticCache(__dirname + '/src/public', {
    //     maxAge: 365 * 24 * 60 * 60,
    //     prefix: 'public'
    // }))
    // 注册路由
    app.use(
        cors({
            origin: '*',
            credentials: true, //是否允许发送Cookie
            allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], //设置所允许的HTTP请求方法
            allowHeaders: ['Content-Type', 'Authorization', 'Accept'], //设置服务器支持的所有头信息字段
            exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'] //设置获取其他自定义字段
        })
    );
    app.use(router.routes())
    app.use(staticServe('./src/web/dist'))
    app.use(staticServe('./src/public'))

    app.listen(80)
}

const setProxyServer = () => {
    const port = 8080;
    http.createServer()
        .on('request', request)
        .on('connect', connect)
        .listen(8080, '0.0.0.0', () => console.log(`代理启动成功，监听0.0.0.0:${port}\n`));
}


const main = () => {
    setWebServer()
    setWebSocketServer()
    setProxyServer()
}

main()

console.log(ip.address())