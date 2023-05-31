import { useMemo, useState } from 'react'
import useWebSocket from 'react-use-websocket';
import styles from './App.module.less'
import { Request, Response } from './definition/proxy';
import ProxyItem from './biz_components/ProxyItem';
import ProxyHeader from './biz_components/ProxyHeader';
import { VerticalLeftOutlined } from '@ant-design/icons'
import ProxyDetail from './biz_components/ProxyDetail';
import { useRequest } from 'ahooks';
import { getLocalInfo } from './server/network';

interface ProxyData { id: number, req: Request, res: Response }

const string2Base64 = (s: string) => {
  const code = encodeURI(s)
  return btoa(code)
}

const getContentType = (t: string) => t?.slice(0, t.indexOf(';') + 1 || t.length)

function App() {
  const [messageHistory, setMessageHistory] = useState<ProxyData[]>([]);
  const [message, setMessage] = useState<ProxyData>()
  const [filter, setFilter] = useState('')
  const list = useMemo(() => messageHistory.filter(o => (o.req.hostname + o.req.path).includes(filter)), [messageHistory, filter])
  const { data } = useRequest(getLocalInfo)

  useWebSocket(`ws://127.0.0.1:${data?.wsPort}/proxy`, {
    onMessage(event) {
      setMessageHistory(o => [JSON.parse(event.data)].concat(o))
    },
  });

  // const connectionStatus = {
  //   [ReadyState.CONNECTING]: 'Connecting',
  //   [ReadyState.OPEN]: 'Open',
  //   [ReadyState.CLOSING]: 'Closing',
  //   [ReadyState.CLOSED]: 'Closed',
  //   [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  // }[readyState];

  return (
    <div className={styles.page}>
      <ProxyHeader onSearch={setFilter}></ProxyHeader>

      <div className={styles.main}>
        <div className={styles.list}>
          <ProxyItem
            style={{ pointerEvents: 'none' }}
            hostname={'Name'}
            statusCode={'Status'}
            contentType={'Type'}
          />
          {list.map((msg) => {
            return (
            <ProxyItem
              onClick={() => setMessage(msg)}
              active={msg.id === message?.id}
              key={msg?.id}
              hostname={`${msg.req.protocol}//${msg.req.hostname}${msg.req.path}`}
              statusCode={msg.res.statusCode || 500}
              contentType={getContentType(msg.res['content-type'])}
            />
          )
          })}
        </div>

        {
          message ? (
            <div className={styles.show}>
              <VerticalLeftOutlined onClick={() => setMessage(undefined)} className={styles.closeIcon} />
              <ProxyDetail req={message?.req} res={message.res} />
            </div>
          ) : null
        }
      </div>
    </div>
  );
}

export default App
