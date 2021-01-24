

import { ReactiveFlags } from './flags';
import { reactive, ReactiveHooks } from './reactive';
import { def } from './utils';

export interface Ref<T> {
    value: T;
    __id: any;
}
export function ref<T>(v: T, hooksOptions?: ReactiveHooks, ...id: any): Ref<T> {
    const o = {value: v} as Ref<T>;
    if (id && id[0]) {
        def(o, ReactiveFlags.ID, {
            configurable: false,
            enumerable: false,
            get() {
                return id[0];
            },
        });
    }
    return reactive(o, hooksOptions);
}
