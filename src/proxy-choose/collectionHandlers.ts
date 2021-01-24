
/**
 * Used as a interceptor for Set/WeakSet/Map/WeakMap
 */

import { track, trackFree, trigger } from '../effect';
import { reactive } from '../reactive';
import { canObservable, toString } from '../utils';

type MapTypes = Map<unknown, unknown> | WeakMap<object, unknown>;
type SetTypes = Set<unknown> | WeakSet<object>;

// const isRawMap = (target: MapTypes) => target.constructor?.name === 'Map';
// const isWeakMap = (target: MapTypes) => target.constructor?.name === 'WeakMap';
// const isMap = (target: MapTypes) => isRawMap(target) || isWeakMap(target);

// const isRawSet = (target: MapTypes) => target.constructor?.name === 'Set';
// const isWeakSet = (target: MapTypes) => target.constructor?.name === 'WeakSet';
// const isSet = (target: MapTypes) => isRawSet(target) || isWeakSet(target);



const sizeSymbol = Symbol('size');
const entriesSymbol = Symbol('entries');
const keysSymbol = Symbol('keys');
const valuesSymbol = Symbol('values');
const forEachSymbol = Symbol('forEach');

interface NotifyAllIteratorMethodConf {
    keys?: boolean;
    values?: boolean;
    entries?: boolean;
    forEach?: boolean;
}

function notifyAllIteratorMethod(target: any, conf: NotifyAllIteratorMethodConf = {}) {
    const {
        keys = true,
        values = true,
        entries = true,
        forEach = true,
    } = conf;
    keys && trigger(target, keysSymbol);
    values && trigger(target, valuesSymbol);
    entries && trigger(target, entriesSymbol);
    forEach && trigger(target, forEachSymbol);
}
/**
 * for `MapTypes` type
 * @param this 
 * @param key 
 * @param value 
 * @returns
 */
function set(this: MapTypes, key: unknown, value: any): MapTypes {
    const hasThisKey = trackFree(() => has.call(this, key as any));
    const _update = () => {
        this.set.call(this, key as any, value);
        trigger(this, key);
    }
    if (!hasThisKey) { // not exist this key
        _update();
        trigger(this, sizeSymbol);
        trigger(this, _getHasSymbol(this, key));
        notifyAllIteratorMethod(this);
    } else {
        const oldValue = trackFree(() => get.call(this, key as any));
        if (oldValue !== value) {
            _update();
            notifyAllIteratorMethod(this, {
                keys: false,
            });
        }
    }
    
    return this;
}

function deleteKey(this: MapTypes, key: string | symbol) {
    const _hasKey = trackFree(() => has.call(this, key));
    if (_hasKey) {
        this.delete.call(this, key as any);
        trigger(this, key);
        trigger(this, sizeSymbol);
        trigger(this, _getHasSymbol(this, key));
        notifyAllIteratorMethod(this);
    }
    return _hasKey;
}

function get(this: MapTypes, key: unknown,) {
    track(this, key);
    let res = this.get.call(this, key as any);
    if (canObservable(res as any)) {
        res = reactive(res as any);
    }
    return res;
}

function size(this: Map<any, any>): number {
    track(this, sizeSymbol);
    return this.size;
}
const _hasSymbol = new Map() as Map<any, Map<unknown, symbol>>;
function _getHasSymbol(target: object, key: unknown): symbol {
    if (_hasSymbol.has(target)) {
        const t = _hasSymbol.get(target) as Map<unknown, symbol>;
        if (t.has(key)) {
            return t.get(key) as symbol;
        } else {
            const s = Symbol(__DEV__ ? toString(key) : '');
            t.set(key, s);
            return s;
        }
    } else {
        const n = new Map();
        _hasSymbol.set(target, n);
        const s = Symbol(__DEV__ ? toString(key) : '');
        n.set(key, s);
        return s;
    }
}

function has(this: MapTypes, key: unknown): boolean {
    track(this, _getHasSymbol(this, key));
    return this.has.call(this, key as any);
}

/**
 * used for set
 * @param this 
 * @param v 
 * @returns
 */
function add(this:SetTypes, v: unknown) {
    if (!( 'add' in this)) return;
    // only trigger when has no value v
    if (!trackFree(() => has.call(this as any, v))) {
        this.add.call(this, v as any);
        trigger(this, v);
        trigger(this, sizeSymbol);
        trigger(this, _getHasSymbol(this, v));
        notifyAllIteratorMethod(this);
    }
    return this;
}

function clear(this: MapTypes | SetTypes) {
    if (!('clear' in this)) return;
    const deleteKeys: any[] = [];
    trackFree(() => forEach.call(this, (_currentValue, currentKey) => {
        deleteKeys.push(currentKey);
    }));
    if (!deleteKeys.length) return;

    this.clear.call(this);

    deleteKeys.forEach((k: any) => {
        trigger(this, k);
        trigger(this, _getHasSymbol(this, k));
    });
    trigger(this, sizeSymbol);
    notifyAllIteratorMethod(this);
}

interface ForEachCallback<T = any> {
    (currentValue: T, currentKey: any): void;
}
function forEach(this: MapTypes | SetTypes, callback: ForEachCallback) {
    if (!('forEach' in this)) return;
    this.forEach.call(this, callback);
    track(this, forEachSymbol);
}

const mutableInstrumentations: Record<string, Function | number> = {
    get,
    get size() {
        // @ts-ignore
        return size.call(this);
    },
    has,
    add,
    set,
    delete: deleteKey,
    clear,
    forEach,
};

const methods: Record<string, Symbol> = {
    entries: entriesSymbol,
    keys: keysSymbol,
    values: valuesSymbol,
};

Object.keys(methods).forEach(k => {
    mutableInstrumentations[k] = function(this: Map<any, any> | Set<any>) {
        const res = (this as any)[k].call(this);
        track(this, methods[k]);
        return res;
    };
})

/**
 * get function
 * @param target 
 * @param key 
 * @param receiver 
 * @returns
 */
export function getHandler(target: any, key: string, _receiver: any): Function {
    let res = Reflect.get(mutableInstrumentations, key, target);
    if (typeof res === 'function') {
        res = res.bind(target);
    }
    return res;
}
export {
    mutableInstrumentations,
}

export default {
    get: getHandler,
}
