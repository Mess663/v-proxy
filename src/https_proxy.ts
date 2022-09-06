import https from 'https';
import forge from 'node-forge';
import tls from 'tls';
import url from 'url';
import fs from 'fs';
import { uniqueId } from 'lodash';
const pki = forge.pki;

var caCert  = pki.certificateFromPem(fs.readFileSync('vProxy.crt').toString());
var caKey= pki.privateKeyFromPem(fs.readFileSync('vProxy.key.pem').toString());
/**
 * 根据域名生成一个伪造的https服务
 */
export function createFakeHttpsWebSite(domain: string, successFun: (p: number) => void, wsInstance) {
    // 拿到受信根证书签发的子证书及生成的私钥
    const fakeCertObj = createFakeCertificateByDomain(caKey, caCert, domain)

    // 启动https服务，接受来自客户端的握手
    var fakeServer = new https.Server({
        key: pki.privateKeyToPem(fakeCertObj.key),
        cert: pki.certificateToPem(fakeCertObj.cert),
        SNICallback: (hostname, done) => {
            done(null, tls.createSecureContext({
                key: pki.privateKeyToPem(fakeCertObj.key),
                cert: pki.certificateToPem(fakeCertObj.cert)
            }))
        }
    });
    fakeServer.listen(0, () => {
        var address = fakeServer.address();
        const port = typeof address === 'string' ? 443 : address?.port 
        successFun(port || 443);
    });
    fakeServer.on('request', (req, res) => {
        // 解析客户端请求
        var urlObject = url.parse(req.url || '');
        const hostName = req.headers.host || '';
        let options =  {
            protocol: 'https:',
            hostname: hostName.split(':')[0],
            method: req.method,
            port: hostName.split(':')[1] || 443,
            path: urlObject.path,
            headers: req.headers
        };
        

        // 拿着客户端的请求参数转发给目标服务器
        const httpsReq = https.request(`https://${options.hostname}${options.path}`, (httpsRes) => {
            res.writeHead(httpsRes.statusCode || 500, httpsRes.headers);
            
            let data = '';
            httpsRes.on('data', (chunk) => {
                data = data + chunk.toString();
            });

            httpsRes.on('end', () => {
                // 拿到目标服务器的所有数据，转发给客户端
                res.write(data)
                res.end();

                fakeServer.close()

                // 通过 websocket 将代理内容发给抓包站点
                if (wsInstance) {
                    wsInstance.send(JSON.stringify({
                        id: uniqueId(),
                        req: options,
                        res: {
                            statusCode: httpsRes.statusCode,    
                            data,
                            ...httpsRes.headers,
                        }
                    }))
                } 
            });
        });

        httpsReq.on('timeout', (e) => {
            console.log('[https timeout]', e)
        })

        httpsReq.end()
    });

    fakeServer.on('error', (e) => {
        console.error('Https Error: ', e);
    });
}

/**
 * 根据所给域名生成对应证书，并通过根证书为其签名
 */
function createFakeCertificateByDomain(caKey: forge.pki.rsa.PrivateKey, caCert: forge.pki.Certificate, domain: string) {
    var keys = pki.rsa.generateKeyPair(2046);
    var cert = pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = (new Date()).getTime()+'';
    cert.validity.notBefore = new Date();
    cert.validity.notBefore.setFullYear(cert.validity.notBefore.getFullYear() - 1);
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 1);

    var attrs = [{
      name: 'commonName',
      value: domain
    }, {
      name: 'countryName',
      value: 'CN'
    }, {
      shortName: 'ST',
      value: 'GuangDong'
    }, {
      name: 'localityName',
      value: 'ShengZhen'
    }, {
      name: 'organizationName',
      value: 'v-proxy'
    }];
    cert.setIssuer(caCert.subject.attributes);
    cert.setSubject(attrs);
    cert.setExtensions([{
        name: 'basicConstraints',
        critical: true,
        cA: false
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
        decipherOnly: true
    },
    {
        name: 'subjectAltName',
        altNames: [{
          type: 2,
          value: domain
        }]
    },
    {
        name: 'subjectKeyIdentifier'
    },
    {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true,
        codeSigning: true,
        emailProtection: true,
        timeStamping: true
    },
    {
        name:'authorityKeyIdentifier'
    }]);

    // 用根证书的私钥进行证书签名，这样此证书才会被浏览器信任
    cert.sign(caKey, forge.md.sha256.create());

    return {
        key: keys.privateKey,
        cert: cert
    };
}