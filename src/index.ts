import http, { IncomingMessage } from 'http';
import net from 'net';
import stream from 'stream';
import url from 'url';
import Koa from 'koa';
import route from 'koa-route';
import websockify from 'koa-websocket';
import cors from 'koa2-cors';
import staticServe from 'koa-static';
import { isObject, omit, uniqueId } from 'lodash';
import needle from 'needle';
import router from './route';
import { createFakeHttpsWebSite } from './https_proxy';
import { isLocalWeb } from './tools/ip';

let wsInstance: WebSocket | null = null;

const request = (
    cReq: http.IncomingMessage,
    cRes: http.ServerResponse,
    ctx,
) => {
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
        // cRes.writeHead(pRes.statusCode || 500, pRes.headers);
        pRes.pipe(cRes);

        let data = '';
        pRes.on('data', (chunk) => {
            data += chunk.toString();
        });

        pRes.on('error', (err) => {
            console.error('[http response]', err);
            pReq.destroy();
        });

        pRes.on('end', () => {
            console.log('----- end');
        });

        if (wsInstance) {
            pRes.on('end', () => {
                wsInstance?.send(JSON.stringify({
                    id: uniqueId(),
                    req: {
                        protocol: 'http',
                        ...options,
                    },
                    res: {
                        statusCode: pRes.statusCode,
                        data,
                        ...pRes.headers,
                    },
                }));
            });
        }
    });
    pReq.on('error', (err) => {
        console.error('[http proxy request]', err);
        cRes.end();
    });

    cReq.pipe(pReq);
    pReq.end();
};

const connect = (cReq: IncomingMessage, cltSocket: stream.Duplex, head: Buffer) => {
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
const setWebSocketServer = () => {
    const app = websockify(new Koa(), {});
    app.ws.use(route.all('/proxy', (ctx) => {
        wsInstance = ctx.websocket;

        ctx.websocket.on('error', (err) => {
            console.log('[ws错误]', err);
            ctx.websocket.terminate();
            setWebSocketServer(app);
        });
    }));
    const wsServer = app.listen(0, () => {
        const address = wsServer.address();
        if (isObject(address)) {
            global.wsPort = address?.port;
        }
    });
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
const setProxyServer = (
    httpServer: http.Server,
) => {
    httpServer
        // .on('request', request)
        .on('connect', connect)
        .on('error', (err) => {
            console.error(`[代理服务]${err.message}`);
        });
};

const main = () => {
    const port = process.argv[2] || 8899;
    const app = new Koa();
    const server = http.createServer(app.callback());
    // const server = http.createServer();

    setWebSocketServer();

    app.use(async (ctx, next) => {
        const reqHost = ctx.request.header.host;

        if (reqHost && isLocalWeb(port, reqHost)) {
            await next();
        } else {
            const method = ctx.req.method || 'get';

            try {
                const res = await needle(method, ctx.req.url, ctx.req.headers);
                // if (ctx.req.url?.includes('system.css')) {
                //     console.log(res.body);
                // }
                ctx.res.writeHead(res.statusCode || 500, res.headers);
                // res.pipe(ctx.res);
                ctx.body = res.body;
            } catch (error) {
                console.log('needle err: ', error);
            } finally {
                await next();
            }

            // request(ctx.req, ctx.res, ctx);
        }
    });

    setWebServer(app);
    setProxyServer(server);

    // app.listen(port);

    server.listen(port, () => console.log(`代理启动成功，监听：127.0.0.1:${port}\n`));

    process.on('uncaughtException', (err) => {
        console.error('Error caught in uncaughtException event:', err);
    });
};

main();
