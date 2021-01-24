// import { clearLastRecord, effect, lastRecordInEffect, setShouldTrack, track, trigger, _changeCurrentEffect } from './effect';
// import { ReactiveFlags } from './flags';
import { currentEffect, EffectTarget } from './effect';
import { _effect, shouldTrack } from './effect';
import { ReactiveFlags } from './flags';
import { KeyType } from './reactive';
import { ref, Ref } from './ref';
import { def } from './utils';

let i = 0;
function getId() {
    return i++;
}
/**
 * 默认懒执行。
 * 当被 effect 依赖时，则直接执行
 * @param fn 
 * @returns
 */
export function computed<T>(fn: () => T, id?: any): Ref<T> {
    const _id = id || getId();
    let runner: any;
    let _hasInitEffect = false;
    let _setFlag: boolean = false;
    let _v: T;
    const update = () => {
        if (update.dirty) {
            _setFlag = true;
            const newValue = fn();
            
            // console.log(`trigger set: old ${_v} new ${newValue}`);
            if (newValue !== _v) {
                update.dirty = false;
                _v = _computedRef.value = newValue;
            }
            _setFlag = false;   
        }
    };
    update.dirty = true;
    update.__id = _id;
    // flag this effect is in computed mode
    update.computed = true;

    // flag this called in effect as least once.
    let _hasCalledInEffect = false;

    const _computedRef = ref<T>(undefined as unknown as T, {
        onGet(_target: any, _key: KeyType) {
            if (_target[ReactiveFlags.ID] !== _computedRef[ReactiveFlags.ID as keyof Ref<any>]) return;
            if (!update.dirty || _setFlag) {
                return;
            }
            if (!_hasCalledInEffect && shouldTrack.length && !currentEffect[0].computed) { // in a effect block
                _hasCalledInEffect = true;
            }

            if (_hasCalledInEffect || !_hasInitEffect) { // exec in effect, trigger should be ignored.
                _hasInitEffect = true;
                _effect(update, {
                    // when fn's deps changed, trigger a schedule.
                    schedule: (_runner: EffectTarget) => {
                        runner = _runner;
                        if (_hasCalledInEffect) {
                            runner();
                        }
                    },
                });
            } else if (update.dirty) {
                runner && runner();
            }
        },
        onSet(_target: any, _key: KeyType, _oldValue: any, _newValue) {
            // when set current ref's value, should check whether is modified by us.
            if (_target[ReactiveFlags.ID] === _computedRef[ReactiveFlags.ID as keyof Ref<any>]) {
                if (__DEV__ && !_setFlag) {
                    console.warn('can not update a computed value');
                }
                return _setFlag;
            }
            return true;
        },
    }, _id);

    def(_computedRef, ReactiveFlags.IS_COMPUTED, {
        enumerable: false,
        configurable: false,
        get() {
            return true;
        },
    });

    return _computedRef;
}
