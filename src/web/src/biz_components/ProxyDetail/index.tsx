import React from 'react';
import css from './index.module.less';
import { Tabs } from 'antd';
import { Request, Response } from '../../definition/proxy';
import {  entries, flow, join, map, omit } from 'lodash/fp';
import { forIn, isArray, isObject, isString } from 'lodash';

const margin = 10

const ProxyDetail = ({req, res}: {req: Request, res: Response}) => {
  return <Tabs defaultActiveKey="1">
    <Tabs.TabPane tab="请求" key="1">
      <div className={css.detail}>
        <div><span className={css.keyName}>URL:</span> {`${req.protocol}//${req.hostname}${req.path}`}</div>
        {
          flow(omit(['protocol', 'hostname', 'path']), entries, map(([key, val]) => (
            <div key={key}>
              <>
                <span className={css.keyName}>{key}:</span> {(() => {
                  if (isArray(val)) return val.join(';')
                  if (isObject(val)) return flow(entries, map(o => `${o[0]}: ${o[1]}`), join(';'))(val)
                  return val
                })()}
              </>
            </div>
          )))(req.headers)
        }
        {
          req.data ? (
            <>
              <div className={css.keyName}>data:</div>
              <div style={{marginLeft: margin}}>{req.data}</div>
            </>
          ) : null
        }
      </div>
    </Tabs.TabPane>
    <Tabs.TabPane tab="响应" key="2">
      <div className={css.detail}>
        {
          flow(omit(['data']), entries, map(([key, val]) => (
            <div key={key}>
              <>
                <span className={css.keyName}>{key}:</span> {(() => {
                  if (isArray(val)) return val.join(';')
                  if (isObject(val)) return flow(entries, map(o => `${o[0]}: ${o[1]}`), join(';'))(val)
                  return val
                })()}
              </>
            </div>
          )))(res)
        }
        {
          res.data ? (
            <>
              <div className={css.keyName}>data:</div>
              <div style={{marginLeft: margin}}>{res.data}</div>
            </>
          ) : null
        }
      </div>
    </Tabs.TabPane>
  </Tabs>
}

export default ProxyDetail;