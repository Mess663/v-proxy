import React from 'react';
import css from './index.module.less';
import { QRCodeSVG } from 'qrcode.react';

const certUrl = 'http://localhost/vProxy.crt'

const HttpsCert = () => {
  return <div className={css.container}>
    <h3>HTTPS</h3>
    <QRCodeSVG style={{width: '100%', height: 'auto'}} value={certUrl} />
    <a className={css.download} href={certUrl}>下载证书</a>
  </div>;
}

export default HttpsCert;