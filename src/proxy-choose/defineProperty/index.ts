
// import { ProxyAdapter } from '../proxyInterface';
import { ReactiveHooks } from '../../reactive';
import { collectionsType, def } from '../../utils';
import {
    mutableInstrumentations,
} from '../collectionHandlers';
import { ReactiveFlags } from '../../flags';
import { responsive } from './method';

type Collections = Map<any, any> | Set<any> | WeakMap<any, any> | WeakSet<any>;
function wrapCollection(collection: Collections): Collections {

    const thisWrapper: Record<string, (...arg: any) => any> = {};

    for (const key in mutableInstrumentations) {
        const oldValue = collection[key as keyof Collections];
        if (oldValue === undefined) continue;
        if (key !== 'size') {
            thisWrapper[key] = oldValue.bind(collection);
            const interceptor = mutableInstrumentations[key] as Function;
            collection[key as keyof Collections] = function(...args: any) {
                return interceptor.apply(thisWrapper, args);
            };
        } else {
            const sizeDesc = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(collection), 'size');
            Object.defineProperty(thisWrapper, 'size', {
                ...sizeDesc,
                get: sizeDesc?.get?.bind(collection),
            });
            const sizeInterceptor = Object.getOwnPropertyDescriptor(mutableInstrumentations, 'size');
            def(collection, 'size', {
                configurable: false,
                enumerable: false,
                get() {
                    return sizeInterceptor?.get?.call(thisWrapper);
                },
            });
        }
    }
    return collection;
}

/**
 * create a reactive object.
 * @param target 
 * @returns
 */
const DefineUse = function DefineUse<T extends Object>(target: T, hooks?: ReactiveHooks) {
    if (hooks) {
        const s = Symbol(__DEV__ ? 'hooks' : '');
        def(target, ReactiveFlags.COMMON_HOOK_ID, {
            configurable: false,
            enumerable: false,
            get() {
                return s;
            },
        });
        DefineUse.hooksMap.set(s, new Map(Object.entries(hooks) as any));
    }
    if (collectionsType.has(target.constructor?.name)) {
        return wrapCollection(target as any as Collections);
    }

    return responsive(target);
}

DefineUse.hooksMap = new Map() as Map<Symbol, Map<keyof ReactiveHooks, Function>>;



export default DefineUse;

export {
    setReactiveKey,
} from './method';
