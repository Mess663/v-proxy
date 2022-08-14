import forge from 'node-forge';
const pki = forge.pki;
import fs from 'fs';

var keys = pki.rsa.generateKeyPair(1024);
var cert = pki.createCertificate();
    
export const createRootCert = () => {
    cert.publicKey = keys.publicKey;
    cert.serialNumber = (new Date()).getTime() + '';

    // 设置CA证书有效期
    cert.validity.notBefore = new Date();
    cert.validity.notBefore.setFullYear(cert.validity.notBefore.getFullYear() - 5);
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 20);

    var attrs = [{
        name: 'commonName',
        value: 'v-proxy' 
    }, {
        name: 'countryName',
        value: 'CN'
    }, {
        shortName: 'ST',
        value: 'GuangDong'
    }, {
        name: 'localityName',
        value: 'ShenZhen'
    }, {
        name: 'organizationName',
        value: 'v-proxy'
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
        cA: true
    }, {
        name: 'keyUsage',
        critical: true,
        keyCertSign: true
    }, {
        name: 'subjectKeyIdentifier'
    }]);

    // 用自己的私钥给CA根证书签名
    cert.sign(keys.privateKey, forge.md.sha256.create());
    var certPem = pki.certificateToPem(cert);
    var keyPem = pki.privateKeyToPem(keys.privateKey);
    
    fs.writeFileSync('vProxy.crt', certPem)
    fs.writeFileSync('vProxy.key.pem', keyPem)
}

createRootCert()