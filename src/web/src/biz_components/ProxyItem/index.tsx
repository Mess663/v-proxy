import React, { CSSProperties } from 'react'
import styles from './index.module.less'

interface Props {
    hostname: string
    statusCode: number | string
    contentType: string
    style?: CSSProperties 
    onClick?: () => void
    active?: boolean
}

const ProxyItem = ({active, onClick, hostname, statusCode, contentType, style}: Props) => {
    return <div style={style} className={styles.item} onClick={onClick}>
        <div title={hostname} className={styles.hostname}>{hostname}</div>
        <div className={styles.statusCode}>{statusCode}</div>
        <div className={styles.contentType}>{contentType}</div>
    </div>
}

export default ProxyItem