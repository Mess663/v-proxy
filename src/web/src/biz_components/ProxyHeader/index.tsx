import React, { useState } from 'react'
import styles from './index.module.less'
import { Modal, Divider, Button } from 'antd'
import { QuestionCircleFilled } from '@ant-design/icons'
import HttpsCert from '../HttpsCert'
import ProxyInfo from '../ProxyInfo'

const ProxyHeader = () => {
    const [show, setShow] = useState(false)
    return <div className={styles.container}>
        <Button type='link' onClick={() => setShow(true)}>连接指引 <QuestionCircleFilled /></Button>

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