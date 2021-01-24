
import { ReactiveHooks } from '../../reactive';
import { collectionsType, def } from '../../utils';
import objHandlers from './objHandlers';
import collectionHandlers from '../collectionHandlers';
import { ReactiveFlags } from '../../flags';


/**
 * create a reactive object.
 * @param target 
 * @returns
 */
const ProxyUse = function ProxyUse<T extends Object>(target: T, hooks?: ReactiveHooks) {
    if (hooks) {
        const s = Symbol(__DEV__ ? 'hooks' : '');
        def(target, ReactiveFlags.COMMON_HOOK_ID, {
            configurable: false,
            enumerable: false,
            get() {
                return s;
            },
        });

        ProxyUse.hooksMap.set(s, new Map(Object.entries(hooks) as any));
    }
    const _proxy = new Proxy(target, collectionsType.has(target.constructor?.name) ? collectionHandlers : objHandlers);
    
    return _proxy;
}
ProxyUse.hooksMap = new Map() as Map<Symbol, Map<keyof ReactiveHooks, Function>>;



export default ProxyUse;