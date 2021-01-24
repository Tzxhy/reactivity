import ProxyUse from '.';
import { isReactive, reactive } from '../..';
import { track, trigger } from '../../effect';
import { ReactiveFlags } from '../../flags';
import { canObservable, def } from '../../utils';


export function get<T>(target: any, key: string | symbol, receiver: any): T {

    if (key === ReactiveFlags.IS_REACTIVE) {
        return true as any;
    } else if (key === ReactiveFlags.RAW) {
        return target;
    } else if (key === '__proto__') {
        return Object.getPrototypeOf(target);
    } else if (key === ReactiveFlags.ID) {
        return target[ReactiveFlags.ID];
    } else if (key === ReactiveFlags.COMMON_HOOK_ID) {
        return target[ReactiveFlags.COMMON_HOOK_ID];
    }
    track(target, key);
    const ri = target[ReactiveFlags.COMMON_HOOK_ID];
    if (ProxyUse.hooksMap.has(ri)) {
        const hookMap = ProxyUse.hooksMap.get(ri);
        const onGet = hookMap?.get('onGet');
        if (onGet && typeof onGet === 'function') {
            onGet(target, key);
        }
    }

    let res = Reflect.get(target, key, receiver);
    if (canObservable(res) && !res[ReactiveFlags.SKIP] && !isReactive(res)) {
        if (ri && !res[ReactiveFlags.COMMON_HOOK_ID]) {
            def(res, ReactiveFlags.COMMON_HOOK_ID, {
                configurable: false,
                enumerable: false,
                get() {
                    return ri;
                },
            });
        }
        res = reactive(res);
    }
    return res;
}

export function set(target: any, key: string, value: any, receiver: any): boolean {
    if (key === '__proto__') {
        return Reflect.set(target, key, value, receiver);
    }

    const oldValue = Reflect.get(target, key, receiver);
    if (oldValue === value) return true;

    const ri = target[ReactiveFlags.COMMON_HOOK_ID];
    // console.log('ri in set: ', ri);
    if (ProxyUse.hooksMap.has(ri)) {
        const hookMap = ProxyUse.hooksMap.get(ri)
        const onSet = hookMap?.get('onSet');
        if (onSet && typeof onSet === 'function') {
            const set = onSet(target, key, oldValue, value);
            if (!set) {
                return true;
            }
        }
    }
    // 拆包
    if (isReactive(value)) {
        value = value[ReactiveFlags.RAW];
    }
    Reflect.set(target, key, value, receiver);
    trigger(target, key);
    return true;
}

export function deleteKey<T extends Object>(target: T, key: string | symbol) {
    Reflect.deleteProperty(target, key);
    trigger(target, key);
    return true;
}

export default {
    get,
    set,
    deleteProperty: deleteKey,
}
