import http, { IncomingMessage } from 'http';
import net from 'net';
import stream from 'stream';
import url from 'url';
import Koa from 'koa';
import route from 'koa-route';
import websockify from 'koa-websocket';
import cors from 'koa2-cors';
import staticServe from 'koa-static';
import { isObject, uniqueId } from 'lodash';
import needle from 'needle';
import chalk from 'chalk';
import * as ws from 'ws';
import router from './route';
import { createFakeHttpsWebSite } from './https_proxy';
import { getIpList, isLocalWeb } from './tools/ip';

let wsInstance: WebSocket | null | ws = null;
const port = process.argv[2] || 8899;

const connect = (cReq: IncomingMessage, cltSocket: stream.Duplex, head: Buffer) => {
    const u = url.parse(`http://${cReq.url}`);

    if (!u.port || !u.hostname) return;

    cltSocket.on('error', (err) => {
        console.log('on cennct cltSocket err: ', cReq.url, err);
    });

    createFakeHttpsWebSite(u.hostname, (tempPort: number) => {
        const srvSocket = net.connect(tempPort, '127.0.0.1', () => {
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

const request = async (
    ctx: Koa.ParameterizedContext<Koa.DefaultState, Koa.DefaultContext, any>,
) => {
    const method = (ctx.req.method || 'get') as 'get';

    try {
        if (!ctx.req.url) throw new Error('url is empty');
        const res = await needle(method, ctx.req.url, ctx.req.headers, {
            timeout: 10000,
        });
        ctx.res.writeHead(res.statusCode || 500, res.headers);
        console.dir(res.headers);
        ctx.body = res.body;

        const u = url.parse(ctx.req.url ?? '');

        const options = {
            hostname: u.hostname,
            port: (u.port || 80),
            path: u.path,
            method,
            headers: ctx.req.headers,
        };

        wsInstance?.send(JSON.stringify({
            id: uniqueId(),
            req: {
                protocol: 'http',
                ...options,
            },
            res: {
                statusCode: res.statusCode,
                data: res.body,
                ...res.headers,
            },
        }));
    } catch (error) {
        console.error('needle err: ', ctx.req.url, error);
    }
};

// 启动ws服务，发送代理条目
const setWebSocketServer = () => {
    const app = websockify(new Koa(), {});
    app.ws.use(route.all('/proxy', (ctx) => {
        wsInstance = ctx.websocket;

        ctx.websocket.on('error', (err) => {
            console.log('[ws错误]', err);
            ctx.websocket.terminate();
            setWebSocketServer();
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
    app: Koa<Koa.DefaultState, Koa.DefaultContext>,
) => {
    app.use(async (ctx, next) => {
        const reqHost = ctx.request.header.host;
        const isLocalHost = reqHost && isLocalWeb(port, reqHost);

        if (!isLocalHost) {
            await request(ctx);
        } else {
            await next();
        }
    });

    httpServer
        .on('connect', connect)
        .on('error', (err) => {
            console.error(`[代理服务]${err.message}`);
        });
};

const startLog = () => {
    const ips = getIpList().map((o) => `${o}:${port}`);
    console.log(chalk.green('v-proxy启动成功: '));

    ips.forEach((o) => {
        const s = `http://${o}`;
        console.log(`    ${chalk.underline(chalk.green(s))}`);
    });
    console.log(chalk.green('请使用上面的ip和端口来设置代理，抓包和安装证书请打开上面地址'));
};

const main = () => {
    const app = new Koa();
    const server = http.createServer(app.callback());

    setWebSocketServer();
    setProxyServer(server, app);
    setWebServer(app);

    server.listen(port, startLog);

    process.on('uncaughtException', (err) => {
        console.error('Error caught in uncaughtException event:', err);
    });
};

main();
