
export interface LocalInfo {
  host: string
  ip: string
  pid: string
}

export const getLocalInfo = () => fetch('http://localhost/local-info', { 
      method: 'Get',
      mode: 'cors',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
    }).then(data => data.json()).then((res) => res.data) as Promise<LocalInfo>