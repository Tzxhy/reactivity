import { ReactiveFlags } from './flags';
import { reactive } from './reactive';
import { def } from './utils';

/**
 * make an object unchangeable.
 * @param target 
 */
export function readonly<T extends Object>(target: T): Readonly<T> {
    def(target, ReactiveFlags.IS_READONLY, {
        configurable: false,
        enumerable: false,
        get() {
            return true;
        },
    });
    return reactive(target, {
        onSet() {
            if (__DEV__) {
                console.warn('can not update on a readonly');
            }
            return false;
        },
    });
}

