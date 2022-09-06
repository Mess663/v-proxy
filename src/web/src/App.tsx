import { useCallback, useEffect, useMemo, useState } from 'react'
import reactLogo from './assets/react.svg'
import { Manager } from "socket.io-client";
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { JsonValue } from 'react-use-websocket/dist/lib/types';
import styles from './App.module.less'
import { useLocalStorageState } from 'ahooks';
import { Request, Response } from './definition/proxy';
import ProxyItem from './biz_components/ProxyItem';
import ProxyHeader from './biz_components/ProxyHeader';
import { VerticalLeftOutlined } from '@ant-design/icons'
import ProxyDetail from './biz_components/ProxyDetail';

interface ProxyData { id: number, req: Request, res: Response }

const string2Base64 = (s: string) => {
  const code = encodeURI(s)
  return btoa(code)
}

const getContentType = (t: string) => t?.slice(0, t.indexOf(';') + 1 || t.length)

const socketUrl = 'ws://127.0.0.1:82/proxy'
function App() {
  const [messageHistory, setMessageHistory] = useState<ProxyData[]>([]);
  const [message, setMessage] = useState<ProxyData>()
  const [filter, setFilter] = useState('')
  const list = useMemo(() => messageHistory.filter(o => (o.req.hostname + o.req.path).includes(filter)), [messageHistory, filter])

  useWebSocket(socketUrl, {
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
  console.log(messageHistory)

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
          {list.map((msg) => (
            <ProxyItem
              onClick={() => setMessage(msg)}
              active={msg.id === message?.id}
              // key={message.id}
              hostname={`${msg.req.protocol}//${msg.req.hostname}${msg.req.path}`}
              statusCode={msg.res.statusCode || 500}
              contentType={getContentType(msg.res['content-type'])}
            />
          ))}
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
