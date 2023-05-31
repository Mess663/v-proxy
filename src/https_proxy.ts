/* eslint-disable import/prefer-default-export */
import https from 'https';
import forge from 'node-forge';
import tls from 'tls';
import url from 'url';
import fs from 'fs';
import { isBuffer, isObject, uniqueId } from 'lodash';
import needle from 'needle';

const { pki } = forge;

/**
 * 根据所给域名生成对应证书，并通过根证书为其签名
 */
function createFakeCertificateByDomain(
    caKey: forge.pki.rsa.PrivateKey,
    caCert: forge.pki.Certificate,
    domain: string,
) {
    const keys = pki.rsa.generateKeyPair(2046);
    const cert = pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = `${(new Date()).getTime()}`;
    cert.validity.notBefore = new Date();
    cert.validity.notBefore.setFullYear(cert.validity.notBefore.getFullYear() - 1);
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 1);

    const attrs = [{
        name: 'commonName',
        value: domain,
    }, {
        name: 'countryName',
        value: 'CN',
    }, {
        shortName: 'ST',
        value: 'GuangDong',
    }, {
        name: 'localityName',
        value: 'ShengZhen',
    }, {
        name: 'organizationName',
        value: 'v-proxy',
    }];
    cert.setIssuer(caCert.subject.attributes);
    cert.setSubject(attrs);
    cert.setExtensions([{
        name: 'basicConstraints',
        critical: true,
        cA: false,
    },
    {
        name: 'keyUsage',
        critical: true,
        digitalSignature: true,
        contentCommitment: true,
        keyEncipherment: true,
        dataEncipherment: true,
        keyAgreement: true,
        keyCertSign: true,
        cRLSign: true,
        encipherOnly: true,
        decipherOnly: true,
    },
    {
        name: 'subjectAltName',
        altNames: [{
            type: 2,
            value: domain,
        }],
    },
    {
        name: 'subjectKeyIdentifier',
    },
    {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true,
        codeSigning: true,
        emailProtection: true,
        timeStamping: true,
    },
    {
        name: 'authorityKeyIdentifier',
    }]);

    // 用根证书的私钥进行证书签名，这样此证书才会被浏览器信任
    cert.sign(caKey, forge.md.sha256.create());

    return {
        key: keys.privateKey,
        cert,
    };
}

const rootCaCert = pki.certificateFromPem(fs.readFileSync('vProxy.crt').toString());
const rootCaKey = pki.privateKeyFromPem(fs.readFileSync('vProxy.key.pem').toString());
/**
 * 根据域名生成一个伪造的https服务
 */
export function createFakeHttpsWebSite(
    domain: string,
    // eslint-disable-next-line no-unused-vars
    successFun: (p: number) => void,
    wsInstance: WebSocket | null,
) {
    // 拿到受信根证书签发的子证书及生成的私钥
    const fakeCertObj = createFakeCertificateByDomain(rootCaKey, rootCaCert, domain);

    // 启动https服务，接受来自客户端的握手
    const fakeServer = new https.Server({
        key: pki.privateKeyToPem(fakeCertObj.key),
        cert: pki.certificateToPem(fakeCertObj.cert),
        SNICallback: (_hostname, done) => {
            done(null, tls.createSecureContext({
                key: pki.privateKeyToPem(fakeCertObj.key),
                cert: pki.certificateToPem(fakeCertObj.cert),
            }));
        },
    });

    fakeServer.listen(0, () => {
        const address = fakeServer.address();
        const port = typeof address === 'string' ? 443 : address?.port;
        successFun(port || 443);
    });

    fakeServer.on('request', async (req, res) => {
        // 解析客户端请求
        const urlObject = url.parse(req.url || '');
        const hostName = req.headers.host || '';

        const options = {
            hostname: hostName.split(':')[0],
            method: req.method,
            port: hostName.split(':')[1] || 443,
            path: urlObject.path,
            headers: req.headers,
        };

        const p = `https://${options.hostname}${options.path}`;

        const method = req.method || 'get';

        try {
            // 拿着客户端的请求参数转发给目标服务器
            const httpsRes = await needle(method, p, req.headers, {
                timeout: 10000,
            });
            // 拿到目标服务器的所有数据，转发给客户端
            res.writeHead(httpsRes.statusCode || 500, httpsRes.headers);

            if (isObject(httpsRes.body) && !isBuffer(httpsRes.body)) {
                res.write(JSON.stringify(httpsRes.body));
            } else {
                res.write(httpsRes.body);
            }

            wsInstance?.send(JSON.stringify({
                id: uniqueId(),
                req: {
                    protocol: 'https',
                    ...options,
                },
                res: {
                    statusCode: httpsRes.statusCode,
                    data: httpsRes.body,
                    ...httpsRes.headers,
                },
            }));
        } catch (error) {
            res.writeHead(500);
            console.error('https needle error: ', p, error);
        }

        res.end();
    });

    fakeServer.on('error', (err) => {
        console.error('[fake server error]: ', err);
    });
}
