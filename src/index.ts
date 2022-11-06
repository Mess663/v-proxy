import http, { IncomingMessage } from 'http';
import net from 'net';
import stream from 'stream';
import url from 'url';
import Koa from 'koa';
import route from 'koa-route';
import websockify from 'koa-websocket';
import cors from 'koa2-cors';
import staticServe from 'koa-static';
import { uniqueId } from 'lodash';
import router from './route';
import { createFakeHttpsWebSite } from './https_proxy';

let wsInstance: WebSocket | null = null;

const request = (cReq: http.IncomingMessage, cRes: http.ServerResponse) => {
    if (!cReq.url) return;

    const u = url.parse(cReq.url);

    const options = {
        hostname: u.hostname,
        port: (u.port || 80),
        path: u.path,
        method: cReq.method,
        headers: cReq.headers,
    };

    const pReq = http.request(options, (pRes) => {
        cRes.writeHead(pRes.statusCode || 500, pRes.headers);
        pRes.pipe(cRes);

        let data = '';
        pRes.on('data', (chunk) => {
            data += chunk.toString();
        });

        pRes.on('error', (err) => {
            console.error('[http response]', err);
            pReq.destroy();
        });

        if (wsInstance) {
            pRes.on('end', () => {
                wsInstance?.send(JSON.stringify({
                    id: uniqueId(),
                    req: options,
                    res: {
                        statusCode: pRes.statusCode,
                        data,
                        ...pRes.headers,
                    },
                }));
            });
        }
    }).on('error', (err) => {
        console.error('[http proxy request]', err);
        cRes.end();
    });

    cReq.pipe(pReq);
};

const connect = (cReq: IncomingMessage, cltSocket: stream.Duplex, head) => {
    const u = url.parse(`http://${cReq.url}`);

    if (!u.port || !u.hostname) return;

    cltSocket.on('error', (err) => {
        console.log('on cennct cltSocket err: ', cReq.url, err);
    });

    createFakeHttpsWebSite(u.hostname, (port: number) => {
        const srvSocket = net.connect(port, '127.0.0.1', () => {
            cltSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
            srvSocket.write(head);
            srvSocket.pipe(cltSocket);
            cltSocket.pipe(srvSocket);
        });
        srvSocket.on('error', (err) => {
            console.error('[https connect error]', err);
            cltSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
        });
    }, wsInstance);
};

// 启动ws服务，发送代理条目
const setWebSocketServer = (app: websockify.App<Koa.DefaultState, Koa.DefaultContext>) => {
    app.ws.use(route.all('/proxy', (ctx) => {
        wsInstance = ctx.websocket;

        ctx.websocket.on('error', (err) => {
            console.log('[ws错误]', err);
            ctx.websocket.terminate();
            setWebSocketServer(app);
        });
    }));
};

const setWebServer = (app: Koa<Koa.DefaultState, Koa.DefaultContext>) => {
    app.use(
        cors({
            origin: '*',
            credentials: true, // 是否允许发送Cookie
            allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // 设置所允许的HTTP请求方法
            allowHeaders: ['Content-Type', 'Authorization', 'Accept'], // 设置服务器支持的所有头信息字段
            exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'], // 设置获取其他自定义字段
        }),
    );
    // 注册路由
    app.use(router.routes());
    app.use(staticServe('./src/web/dist'));
    app.use(staticServe('./src/public'));
};

// http、https代理
const setProxyServer = (httpServer: http.Server) => {
    httpServer.on('connect', connect)
        .on('error', (err) => {
            console.error(`[代理服务]${err.message}`);
        });
};

const main = () => {
    const app = websockify(new Koa(), {});
    const server = http.createServer(app.callback());

    setWebServer(app);
    setWebSocketServer(app);
    setProxyServer(server);

    const webPort = process.argv[2] || 8899;
    server.listen(webPort, () => console.log(`代理启动成功，监听：0.0.0.0:${webPort}\n`));

    process.on('uncaughtException', (err) => {
        console.error('Error caught in uncaughtException event:', err);
    });
};

main();
