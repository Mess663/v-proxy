import Router from 'koa-router';
import os from 'os';
import { getIpList } from './tools/get_ip';

const router = new Router();

router.get('/local-info', (ctx) => {
    if (ctx.method === 'OPTIONS') {
        ctx.body = 200;
    } else {
        ctx.header['access-control-allow-credentials'] = 'true';
        ctx.header['access-control-allow-methods'] = 'Get';
        ctx.header['access-control-allow-origin'] = '*';
        ctx.header['Access-Control-Allow-Headers'] = 'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers';
        ctx.body = JSON.stringify({
            status: 200,
            data: {
                ip: getIpList(),
                pid: process.pid,
                host: os.hostname(),
                port: process.argv[2] || 8899,
                wsPort: global.wsPort,
            },
        });
    }
});

export default router;
