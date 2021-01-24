import { ReactiveFlags } from './flags';


const map: Map<object, Map<string, Set<EffectTarget>>> = new Map();

export function getDepMapInDev() {
    if (__DEV__) {
        const ret: any = {};
        map.forEach((value, key: any) => {
            ret[key[ReactiveFlags.ID]] = value;
        })
        return ret;
    }
    console.error('can not get DepMap in prd env');
    return null;
}

export let currentEffect: EffectTarget[] = [];
export let shouldTrack: boolean[] = [];

let shouldTrackFlag: boolean = true;
export function trackFree(fn: () => any) {
    shouldTrackFlag = false;
    const res = fn();
    shouldTrackFlag = true;
    return res;
}
export function pushTrack(effect: EffectTarget) {
    currentEffect.push(effect);
    shouldTrack.push(true);
}
export function popTrack() {
    currentEffect.pop();
    shouldTrack.pop();
}


interface EffectOptions {
    /** is lazy execution */
    lazy?: boolean;
    
    onTrack?: () => void;

    onTrigger?: () => void;

    schedule?: (t: EffectTarget) => void;

    onStop?: () => void;
}
export function stop(_runner: EffectTarget) {

}

export interface EffectTarget {
    dirty?: boolean;
    (): void;

    /** 是否是计算属性 */
    computed?: boolean;

    // active?: boolean;
    /**
     * Work as a interceptor of how to execute the effect except for the first
     * time execution. If `schedule` is provided, the default execution will be disabled(
     * except for the first time), replacing by passing the execution job 
     * handler(as effect) to this function. You need to call this function manually.
     */
    schedule?: (effect: EffectTarget) => void;

    raw?: EffectTarget;
}
let isManualExecEffect = false;

export function effect(fn: EffectTarget, _options?: EffectOptions) {
    isManualExecEffect = true;
    _effect(fn, _options);
    isManualExecEffect = false;
}

export function _effect(fn: EffectTarget, _options?: EffectOptions) {
    pushTrack(fn);
    if (_options) {
        fn.schedule = _options.schedule;
    }
    fn();
    popTrack();
}

/**
 * record computed dep.
 */
export const computedDeps: Map<EffectTarget, Set<EffectTarget>> = new Map();

export function track<T extends object>(target: T, key: any) {

    if (!shouldTrackFlag || !shouldTrack.length || !currentEffect.length) return;
    let objDeps;
    if (map.has(target)) {
        objDeps = map.get(target);
    } else {
        objDeps = new Map();
        map.set(target, objDeps);
    }
    let keyDeps: Set<Function>;
    if (objDeps?.has(key)) {
        keyDeps = objDeps.get(key);
    } else {
        keyDeps = new Set();
        objDeps?.set(key, keyDeps);
    }

    currentEffect.slice(currentEffect.length - 1).forEach(i => {
        keyDeps.add(i);
    });
    if (currentEffect[currentEffect.length - 1].computed && currentEffect[currentEffect.length - 2]?.computed) {
        const dep = currentEffect[currentEffect.length - 2];
        const beDep = currentEffect[currentEffect.length - 1];
        let depsSet: Set<EffectTarget>;
        if (computedDeps.has(beDep)) {
            depsSet = computedDeps.get(beDep) as Set<EffectTarget>;
        } else {
            depsSet = new Set();
            computedDeps.set(beDep, depsSet);
        }
        depsSet.add(dep);
    }
    // debugger;
}

export enum TriggerType {
    SET = 'set',
}

export function trigger<T extends object>(target: T, key: any, _type: TriggerType = TriggerType.SET) {
    if (isManualExecEffect) return;
    // console.log('trigger key: ', key);
    
    let objDeps;
    if (map.has(target)) {
        objDeps = map.get(target);
    } else {
        objDeps = new Map();
        map.set(target, objDeps);
    }
    let keyDeps: Set<EffectTarget>;
    if (objDeps?.has(key)) {
        keyDeps = objDeps.get(key);
    } else {
        keyDeps = new Set();
        objDeps?.set(key, keyDeps);
    }

    keyDeps.forEach((fn: EffectTarget) => {
        if (fn.computed) {
            makeDirty(fn);
        }

        const recaptureDep = () => {
            
            pushTrack(fn);
            fn();
            popTrack();
        };
        recaptureDep.raw = fn;
        
        if (fn.schedule) {
            fn.schedule(recaptureDep);
        } else {
            recaptureDep();
        }
        
    });
    
}

function makeDirty(computed: EffectTarget) {
    computed.dirty = true;
    if (computedDeps.has(computed)) {
        const deps = computedDeps.get(computed);
        deps?.forEach(d => {
            d.dirty = true;
            makeDirty(d);
        });
    }
}
