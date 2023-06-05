import { spawn } from 'child_process';
import Storage from 'node-storage';
import chalk from 'chalk';
import { getIpList } from './tools/ip';

const ChildIdKey = 'ChildId';
const storage = new Storage('./.storage');

const port = process.argv[2] || '8899';
const startLog = () => {
    const ips = getIpList().map((o) => `${o}:${port}`);
    console.log(chalk.green('v-proxy启动成功: '));

    ips.forEach((o) => {
        const s = `http://${o}`;
        console.log(`    ${chalk.underline(chalk.green(s))}`);
    });
    console.log(chalk.green('请使用上面的ip和端口来设置代理，抓包和安装证书请打开上面地址'));
};

//
function startDaemon() {
    const daemon = spawn('node', ['lib/start.js', port], {
        detached: true,
        stdio: 'ignore',
    });
    startLog();

    daemon.stdout?.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    storage.put(ChildIdKey, daemon.pid);
    daemon.unref();
}

if (['stop', 'end', 'close'].includes(process.argv[2]?.trim())) {
    const childId = storage.get(ChildIdKey);
    console.log(chalk.green('v-proxy已停止'));
    process.kill(childId);
    storage.put(ChildIdKey, null);
} else {
    startDaemon();
}
