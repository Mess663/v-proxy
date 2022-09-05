
export interface LocalInfo {
  host: string
  ip: string
  pid: string
}
export const getLocalInfo = () => fetch('http://localhost/local-info', { 
      method: 'Get',
      headers: {
        'Content-Type': 'application/json'
      },
    }).then(data => data.json()).then((res) => res.data) as Promise<LocalInfo>