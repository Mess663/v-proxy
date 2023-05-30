import React from 'react';
import css from './index.module.less';
import { QRCodeSVG } from 'qrcode.react';
import { useRequest } from 'ahooks';
import { getLocalInfo } from '../../server/network';

const certUrl = '/vProxy.crt'

const HttpsCert = () => {
  const { data } = useRequest(getLocalInfo)
  return <div className={css.container}>
    <h3>HTTPS</h3>
    <QRCodeSVG style={{width: '100%', height: 'auto'}} value={`http://${data?.ip?.[0]}/vProxy.crt`} />
    <a className={css.download} href={certUrl}>下载证书</a>
  </div>;
}

export default HttpsCert;