import forge from 'node-forge';
import fs from 'fs';

const { pki } = forge;

const keys = pki.rsa.generateKeyPair(1024); // 非对称密钥对
const cert = pki.createCertificate(); // 根证书

// eslint-disable-next-line import/prefer-default-export
export const createRootCert = () => {
    cert.publicKey = keys.publicKey; // 公钥放进证书里
    cert.serialNumber = `${(new Date()).getTime()}`;

    // 设置CA证书有效期
    cert.validity.notBefore = new Date();
    cert.validity.notBefore.setFullYear(cert.validity.notBefore.getFullYear() - 5);
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 20);

    // 填充证书基本内容
    const attrs = [{
        name: 'commonName',
        value: 'v-proxy',
    }, {
        name: 'countryName',
        value: 'CN',
    }, {
        shortName: 'ST',
        value: 'GuangDong',
    }, {
        name: 'localityName',
        value: 'ShenZhen',
    }, {
        name: 'organizationName',
        value: 'v-proxy',
    },
    // {
    //     shortName: 'OU',
    //     value: ''
    // }
    ];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.setExtensions([{
        name: 'basicConstraints',
        critical: true,
        cA: true,
    }, {
        name: 'keyUsage',
        critical: true,
        keyCertSign: true,
    }, {
        name: 'subjectKeyIdentifier',
    }]);

    // 用自己的私钥给CA根证书签名
    cert.sign(keys.privateKey, forge.md.sha256.create());
    const certPem = pki.certificateToPem(cert);
    const keyPem = pki.privateKeyToPem(keys.privateKey);

    fs.writeFileSync('vProxy.crt', certPem);
    fs.writeFileSync('vProxy.key.pem', keyPem);
};

createRootCert();
