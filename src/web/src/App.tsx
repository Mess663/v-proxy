import { useCallback, useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import { Manager } from "socket.io-client";
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { JsonValue } from 'react-use-websocket/dist/lib/types';
import styles from './App.module.less'

interface ProxyData {hostname: string, path: string, protocol: string, data: string, headers: Record<string, string>}

const string2Base64 = (s: string) => {
    const code = encodeURI(s) 
    return btoa(code) 
}

const socketUrl = 'ws://v.proxy.com:82/proxy'
function App() {
  const [messageHistory, setMessageHistory] = useState<ProxyData[]>([]);
  const [message, setMessage] = useState<ProxyData>()

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

  return (
    <div className={styles.page}>
      <ul className={styles.list}>
        {messageHistory.map((message, idx) => (
          <div key={idx} className={styles.item} onClick={() => setMessage(message)}>
            {message ? `${message.protocol}//${message.hostname}${message.path}` : null}
          </div>
        ))}
      </ul>

      <div className={styles.show}>
          {
            message?.headers.accept.includes('image') ? 
            <img src={string2Base64(message.data)} /> :
            message?.data
          }
      </div>
    </div>
  );
}

export default App
