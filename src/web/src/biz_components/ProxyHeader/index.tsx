import React, { useState } from 'react'
import styles from './index.module.less'
import { Modal, Divider, Button } from 'antd'
import { QuestionCircleFilled } from '@ant-design/icons'
import HttpsCert from '../HttpsCert'
import ProxyInfo from '../ProxyInfo'
import ProxyFilter from '../ProxyFilter'

const ProxyHeader = ({onSearch}: {onSearch: (s: string) => void}) => {
    const [show, setShow] = useState(false)
    return <div className={styles.container}>
        <Button type='link' onClick={() => setShow(true)}>连接指引 <QuestionCircleFilled /></Button>

        <div className={styles.filter}>
            过滤URL：<ProxyFilter onSearch={onSearch} />
        </div>

        <Modal
            footer={null}
            closable 
            onCancel={() => setShow(false)}
            visible={show}
        >
            <HttpsCert />
            <Divider />
            <ProxyInfo />
        </Modal>
    </div>
}

export default ProxyHeader