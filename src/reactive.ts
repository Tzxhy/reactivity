
import { ReactiveFlags } from './flags';
import {
    ProxyChooser,
} from './proxyInterface';
import { canObservable, def, toString } from './utils';

export type KeyType = string | symbol;

export interface ReactiveHooks {
    /**
     * Before get a key.
     */
    onGet?: (target: any, key: KeyType) => void;
    /**
     * Before set a value to target. True will set the value, otherwise the set operation
     * will be ignored. Every nested object inner in target will be trapped
     * in. So, if you want to make a readonly reactive, always return false.
     */
    onSet?: (target: any, key: KeyType, oldValue: any, newValue: any) => boolean | void;
}

export function reactive<T extends object>(target: T, hooks?: ReactiveHooks): T {
    // can not be observed, warn and return.
    if (!canObservable(target)) {
        if (__DEV__) {
            console.error(`${reactive.name} can not handle with ${toString(target)}`);
        }
        return target;
    }
    // self is reactive, just return.
    if (isReactive(target)) return target;

    // marked as skip, return.
    if ((target as Record<any, any>)[ReactiveFlags.SKIP]) {
        if (__DEV__) {
            console.warn(`${arguments.callee} skip handle ${target}`);
        }
        return target;
    }

    // this object has been flagged with reactive, return the proxy object.
    if ((target as Record<any, any>)[ReactiveFlags.REACTIVE]) {
        return (target as Record<any, any>)[ReactiveFlags.REACTIVE];
    }

    if ((target as Record<any, any>)[ReactiveFlags.IS_COMPUTED]) return target;

    const _proxy = ProxyChooser(target, hooks);
    def(target, ReactiveFlags.REACTIVE, {
        configurable: true,
        value: _proxy,
    });
    if (!(target as any)[ReactiveFlags.ID]) {
        const v = Math.random().toString(32).slice(2);
        def(target, ReactiveFlags.ID, {
            configurable: false,
            enumerable: false,
            get() {
                return v;
            },
        });
    }
    return _proxy;
}

export function isReactive(target: any) {
    if (!canObservable(target)) {
        return false;
    }
    return !!target[ReactiveFlags.IS_REACTIVE];
}

export function toRaw(target: any) {
    if (!isReactive(target)) {
        return target;
    }
    return (target as Record<any, any>)[ReactiveFlags.RAW];
}

export function markRaw(target: any) {
    target[ReactiveFlags.SKIP] = true;
    return target;
}
