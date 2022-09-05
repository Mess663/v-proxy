import { useCallback, useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import { Manager } from "socket.io-client";
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { JsonValue } from 'react-use-websocket/dist/lib/types';
import styles from './App.module.less'
import { useLocalStorageState } from 'ahooks';
import { Request, Response } from './definition/proxy';
import ProxyItem from './biz_components/ProxyItem';
import ProxyHeader from './biz_components/ProxyHeader';

interface ProxyData { id: number, req: Request, res: Response }

const string2Base64 = (s: string) => {
  const code = encodeURI(s)
  return btoa(code)
}

const getContentType = (t: string) => t?.slice(0, t.indexOf(';') + 1 || t.length)

const socketUrl = 'ws://127.0.0.1:82/proxy'
function App() {
  // const [messageHistory, setMessageHistory] = useState<ProxyData[]>([]);
  const [message, setMessage] = useState<ProxyData>()
  const [messageHistory, setLocal] = useLocalStorageState<ProxyData[]>('message')

  // useWebSocket(socketUrl, {
  //   onMessage(event) {
  //     setLocal(o => {
  //       console.log(o)
  //       const d = JSON.parse(event.data)
  //       if (!o) return [d]
  //       return [...o, d]
  //     })
  //     setMessageHistory(o => [JSON.parse(event.data)].concat(o))
  //   },
  // });

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
      <ProxyHeader></ProxyHeader>

      <div className={styles.main}>
        <div className={styles.list}>
          <ProxyItem 
            hostname={'Name'} 
            statusCode={'Status'} 
            contentType={'Type'}
          />
          {messageHistory.map((message) => (
            <ProxyItem 
              // key={message.id}
              hostname={`${message.req.protocol}//${message.req.hostname}${message.req.path}`} 
              statusCode={message.res.statusCode || 500} 
              contentType={getContentType(message.res['content-type'])}
            />
          ))}
        </div>

        <div className={styles.show}>
          {/* {
            message?.headers.accept.includes('image') ?
              <img src={string2Base64(message.data)} /> :
              message?.data
          } */}
        </div>
      </div>
    </div>
  );
}

export default App
