import React from 'react';
import css from './index.module.less';

const ProxyFilter = ({onSearch}: {onSearch: (s: string) => void}) => {
  return <div className={css.container}>
    <input type="text" onInput={(e) => onSearch(e.currentTarget.value)} />
  </div>;
}

export default ProxyFilter;