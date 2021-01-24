import DefineUse from '.';
import { isReactive, reactive } from '../..';
import { track, trigger } from '../../effect';
import { ReactiveFlags } from '../../flags';
import { canObservable, def } from '../../utils';

function getRawTarget<T extends Record<string | symbol, any>>(target: T): T {
    return target && target[ReactiveFlags.RAW];
}
// interface Getter {
//     (): any;
// }

// interface Setter {
//     (value: any): void;
// }

/**
 * make an object responsive with Object.defineProperty
 * @param target 
 */
function responsive<T extends Record<string | symbol, any>>(target: T) {

    const proxyTarget: Record<string | symbol, any> = {
        [ReactiveFlags.RAW]: target,
    };
    def(proxyTarget, ReactiveFlags.IS_REACTIVE, {
        configurable: false,
        enumerable: false,
        get: () => true,
    });
    for (const key in target) {
        setKey(proxyTarget, key, target[key]);
    }
    return proxyTarget;
}

function setKey<T extends Record<string | symbol, any>>(target: T, key: string | symbol, originValue: any): void {
    const get = () => {
        track(target, key);
        const ri = getRawTarget(target)[ReactiveFlags.COMMON_HOOK_ID];
        if (DefineUse.hooksMap.has(ri)) {
            const hookMap = DefineUse.hooksMap.get(ri);
            const onGet = hookMap?.get('onGet');
            if (onGet && typeof onGet === 'function') {
                onGet(target, key);
            }
        }
        let res = originValue;
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
            // may become a new proxy target
            res = reactive(res);
        }
        return res;
    };

    const set = (value: any) => {
        if (originValue === value) return true;
        const ri = getRawTarget(target)[ReactiveFlags.COMMON_HOOK_ID];
        // console.log('ri in set: ', ri);
        if (DefineUse.hooksMap.has(ri)) {
            const hookMap = DefineUse.hooksMap.get(ri)
            const onSet = hookMap?.get('onSet');
            if (onSet && typeof onSet === 'function') {
                const set = onSet(target, key, originValue, value);
                if (!set) {
                    return true;
                }
            }
        }
        // 拆包
        if (isReactive(value)) {
            value = value[ReactiveFlags.RAW];
        }
        // change closure value
        originValue = value;
        // change origin object value
        target[ReactiveFlags.RAW][key] = value;
        trigger(target, key);
        return true;
    }
    def(target, key, {
        enumerable: true,
        configurable: false,
        get,
        set,
    });
}

function setReactiveKey<T extends Record<string | symbol, any>>(target: T, key: string | symbol, originValue: any): void {
    if (typeof target !== 'object' || !getRawTarget(target) || getRawTarget(target)[ReactiveFlags.IS_READONLY]) {
        if (__DEV__) {
            console.warn('Don\'t operate on a non reactive or readonly object');
        }
        return;
    }
    setKey(target, key, originValue);
}

export {
    responsive,
    setReactiveKey,
};