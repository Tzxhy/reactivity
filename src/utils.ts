

export function def<T extends object>(target: T, key: string | symbol, value: PropertyDescriptor) {
    Object.defineProperty(
        target,
        key,
        value,
    );
}

export function isObject<T>(target: T): boolean {
    return Object.prototype.toString.call(target).slice(8, -1) === 'Object';
}


export const collectionsType = new Set([
    'Map',
    'Set',
    'WeakMap',
    'WeakSet',
])
/**
 * Define data types that can be observed. e.g:
 * 1. Object
 * 2. Array
 * 3. Map
 * 4. Set
 * 5. WeakMap
 * 6. WeakSet
 * @param target 
 */
const observableMap = new Set([
    'Object',
    'Array',
    ...collectionsType.values(),
]);
const _toString = Object.prototype.toString;
const getType = (_: Object) => _toString.call(_).slice(8, -1);

export function canObservable<T extends Object>(target: T) {
    return observableMap.has(getType(target)) && !Object.isFrozen(target);
}
const canToStringPrimitiveType = [
    'number',
    'boolean',
    'string',
    'undefined',
    'bigint',
]
export function toString(target: any) {
    const t = typeof target;
    if (canToStringPrimitiveType.includes(t) || t === null) {
        return '' + target;
    } else if (t === 'symbol') {
        return target.toString();
    } else if (t === 'object') {
        return t.toString();
    }
    return _toString.call(target);
}
