import { useRequest } from 'ahooks';
import React, { useEffect } from 'react';
import css from './index.module.less';
import { Typography, Space } from 'antd'

const { Text } = Typography;

interface LocalInfo {
  host: string
  ip: string
  pid: string
}

const ProxyInfo = () => {
  const { data } = useRequest<LocalInfo, void[]>(() => fetch('http://localhost/local-info', { 
      method: 'Get',
      headers: {
        'Content-Type': 'application/json'
      },
    }).then(data => data.json()).then((res) => res.data)
  )
  
  return <div className={css.container}>
    <Space direction='vertical'>
      <Text strong>Host: {data?.host}</Text>
      <Text strong>IP：{data?.ip}</Text>
      <Text strong>Pid: {data?.pid}</Text>
    </Space>
  </div>;
}

export default ProxyInfo;