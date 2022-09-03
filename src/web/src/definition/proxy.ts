export interface Request {
    hostname: string, 
    path: string, 
    protocol: string, 
    data: string, 
    headers: Record<string, string> 
}

export interface Response extends Record<string, unknown> {
    'set-cookie': string[]
    'content-type': string
    data: string
    statusCode: number
}
