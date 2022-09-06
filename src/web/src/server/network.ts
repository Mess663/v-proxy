
export interface LocalInfo {
  host: string
  ip: string
  pid: string
  port: number
}

const baseUrl = import.meta.env.DEV ? 'http://localhost:8899' : ''

export const getLocalInfo = () => fetch(baseUrl + '/local-info', { 
      method: 'Get',
      // mode: 'no-cors',
      headers: {
        // 'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
    }).then(data => data.json()).then((res) => res.data) as Promise<LocalInfo>