import { effect, trackFree } from './effect';

/**
 * First exec fn, get all dependencies. Any dependency change will
 * trigger callback.
 * @param fn 
 * @param callback 
 */
export function watch(fn: () => any, callback: () => void) {

    effect(fn, {
        schedule(_runner) {
            // every data retrieve should not be tracked.
            trackFree(callback);
        },
    });
}
