import { useRequest } from 'ahooks';
import React, { useEffect } from 'react';
import css from './index.module.less';
import { Typography, Space } from 'antd'
import { getLocalInfo } from '../../server/network';

const { Text } = Typography;

const ProxyInfo = () => {
  const { data } = useRequest(getLocalInfo)
  
  return <div className={css.container}>
    <Space direction='vertical'>
      <Text strong>Host: {data?.host}</Text>
      <Text strong>
        <ul>
          IP：
          {data?.ip.map((o: string) => <li key={o}>{o}</li>)}
        </ul>
      </Text>
      <Text strong>Port：{data?.port}</Text>
      <Text strong>Pid: {data?.pid}</Text>
    </Space>
  </div>;
}

export default ProxyInfo;