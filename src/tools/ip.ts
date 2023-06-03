import os from 'os';

// eslint-disable-next-line import/prefer-default-export
export const getIpList = () => {
    const ipList: string[] = [];
    const ifaces = os.networkInterfaces();
    Object.keys(ifaces).forEach((ifname) => {
        ifaces[ifname]?.forEach((iface) => {
            if (iface.family == 'IPv4') {
                ipList.push(iface.address);
            }
        });
    });
    const index = ipList.indexOf('127.0.0.1');
    if (index !== -1) {
        ipList.splice(index, 1);
    }
    ipList.unshift('127.0.0.1');
    return ipList;
};

/**
 * 判断是否为本地web服务
 * @param port
 * @param targetIp
 */
export const isLocalWeb = (port: string | number, targetIp: string) => {
    const ipList = getIpList().map((ip) => `${ip}:${port}`);
    return ipList.includes(targetIp);
};
