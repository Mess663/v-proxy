import React, { CSSProperties } from 'react'
import styles from './index.module.less'
import classNames from 'classnames';
interface Props {
    hostname: string
    statusCode: number | string
    contentType: string
    style?: CSSProperties 
    onClick?: () => void
    active?: boolean
}

const ProxyItem = ({active, onClick, hostname, statusCode, contentType, style}: Props) => {
    return <div style={style} className={classNames(styles.item, {[styles.active]: active})} onClick={onClick}>
        <div title={hostname} className={styles.hostname}>{hostname}</div>
        <div className={styles.statusCode}>{statusCode}</div>
        <div className={styles.contentType}>{contentType}</div>
    </div>
}

export default ProxyItem