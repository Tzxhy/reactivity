// Define a proxy adapter for intercept the operation of data.

import ProxyUse from './proxy-choose/proxy';
import { ReactiveHooks } from './reactive';


export interface ProxyAdapter<T> {
    (target: T, hooks?: ReactiveHooks): T;
    [k: string]: any;
}

let ProxyChooser: ProxyAdapter<any>;
if (typeof Proxy === 'function') {
    ProxyChooser = ProxyUse;
} else {
    ProxyChooser = ProxyUse;
}

function changeProxy(m: ProxyAdapter<any>) {
    ProxyChooser = m;
}

export {
    ProxyChooser,
    changeProxy,
};
