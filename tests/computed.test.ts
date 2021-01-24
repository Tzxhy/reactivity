
import {
    effect,
    // isReactive,
    // markRaw,
    reactive,
    // toRaw,
    // ref,
    computed,
} from '../src/index';

describe('reactivity/computed', () => {

    it('should return updated value', () => {
        const value = reactive<{ foo?: number }>({})
        const getValue = jest.fn(() => value.foo);
        const cValue = computed(getValue);
        expect(getValue).toHaveBeenCalledTimes(0);
        expect(cValue.value).toBe(undefined)
        expect(getValue).toHaveBeenCalledTimes(1);
        value.foo = 1
        expect(getValue).toHaveBeenCalledTimes(1);
        expect(cValue.value).toBe(1)
        expect(getValue).toHaveBeenCalledTimes(2);
    })

    it('should compute lazily', () => {
        const value = reactive<{ foo?: number }>({})
        const getter = jest.fn(() => value.foo)
        const cValue = computed(getter)

        // lazy
        expect(getter).not.toHaveBeenCalled()

        expect(cValue.value).toBe(undefined)
        expect(getter).toHaveBeenCalledTimes(1)

        // should not compute again
        cValue.value
        expect(getter).toHaveBeenCalledTimes(1)

        // should not compute until needed
        value.foo = 1
        expect(getter).toHaveBeenCalledTimes(1)

        // now it should compute
        expect(cValue.value).toBe(1)
        expect(getter).toHaveBeenCalledTimes(2)

        // should not compute again
        cValue.value
        expect(getter).toHaveBeenCalledTimes(2)

        value.foo = 1
        expect(getter).toHaveBeenCalledTimes(2)
        expect(cValue.value).toBe(1)
    })

    it('should trigger effect', () => {
        const value = reactive<{ foo?: number }>({})
        const com = jest.fn(() => value.foo)
        const cValue = computed(com);
        expect(com).toBeCalledTimes(0);
        let dummy
        effect(() => {
            console.log('in effect');
            
            dummy = cValue.value
        })
        console.log(dummy);
        
        expect(com).toBeCalledTimes(1);
        expect(dummy).toBe(undefined)
        value.foo = 1
        expect(com).toBeCalledTimes(2);
        expect(cValue.value).toBe(1);
        expect(dummy).toBe(1)
    })

    it('set computed value cause error', () => {
        const obj = reactive({age: 10});
        const value = computed(() => obj.age);
        expect(value.value).toBe(10);
        const update = () => {
            value.value = 20;
        }
        update();
        expect(value.value).toBe(10);
    });

    it('should work when chained', () => {
        const value = reactive({ foo: 0 })
        const c1 = computed(() => {
            // console.log('enter c1');
            return value.foo;
        }, Symbol('c1'))
        const c2 = computed(() => {
            // console.log('enter c2');
            return c1.value + 1
        }, Symbol('c2'))
        expect(c2.value).toBe(1)
        expect(c1.value).toBe(0)
        // console.log('======');
        
        value.foo = 10
        expect(c2.value).toBe(11)
        expect(c1.value).toBe(10)
    })


    it('should trigger effect when chained', () => {
        const value = reactive({ foo: 0, name: Symbol('hh') })
        
        const getter1 = jest.fn(() => {
            // console.log('getter1');
            
            return value.foo;
        });
        
        const getter2 = jest.fn(() => {
            // console.log('getter2');
            return c1.value + 1
        })
        const c1 = computed(getter1, Symbol('getter1'))
        const c2 = computed(getter2, Symbol('getter2'))

        let dummy
        effect(() => {
            // console.log('effect');
            
            dummy = c2.value
        });
        expect(dummy).toBe(1)
        expect(getter2).toHaveBeenCalledTimes(1)
        expect(getter1).toHaveBeenCalledTimes(1)
        // console.log('=========');
        value.foo++
        expect(dummy).toBe(2)
        // should not result in duplicate calls
        expect(getter1).toHaveBeenCalledTimes(2)
        // expect(getter2).toHaveBeenCalledTimes(2)
    })

    it('should trigger effect when chained', () => {
        const value = reactive({ foo: 0, name: Symbol('hh') })
        
        const getter1 = jest.fn(() => {
            // console.log('getter1'); 
            return value.foo;
        });
        const getter2 = jest.fn(() => {
            // console.log('getter2');
            return c1.value + 1
        })
        const c1 = computed(getter1)
        const c2 = computed(getter2)

        let dummy
        effect(() => {
            // console.log('effect');
            dummy = c2.value
        });
        expect(dummy).toBe(1)
        expect(getter2).toHaveBeenCalledTimes(1)
        expect(getter1).toHaveBeenCalledTimes(1)
        // console.log('=========');
        value.foo++
        expect(dummy).toBe(2)
        expect(getter1).toHaveBeenCalledTimes(2)
        expect(getter2).toHaveBeenCalledTimes(2)
    })

    it('should trigger effect when chained (mixed invocations)', () => {
        const value = reactive({ foo: 0 })
        const getter1 = jest.fn(() => value.foo)
        const getter2 = jest.fn(() => {
            return c1.value + 1
        })
        const c1 = computed(getter1)
        const c2 = computed(getter2)

        let dummy
        effect(() => {
            dummy = c1.value + c2.value
        })
        expect(dummy).toBe(1)

        expect(getter1).toHaveBeenCalledTimes(1)
        expect(getter2).toHaveBeenCalledTimes(1)
        value.foo++
        expect(dummy).toBe(3)
        // should not result in duplicate calls
        expect(getter1).toHaveBeenCalledTimes(2)
        expect(getter2).toHaveBeenCalledTimes(2)
    })

    it('modify computed key', () => {
        const value = reactive({ foo: 0 });
        const getter1 = jest.fn(() => ({name: 'test', age: value.foo + 10}));
        const g1 = computed(getter1);
        expect(getter1).toBeCalledTimes(0);
        g1.value.name = 'modified';
        expect(g1.value.age).toBe(10);
        expect(g1.value.name).toBe('modified');
    })

    it('computed return should be reactive', () => {
        const value = reactive({ foo: 0 });
        const getter1 = jest.fn(() => ({name: 'test', age: value.foo + 10}));
        const g1 = computed(getter1);

        let name;
        const effectCb = jest.fn(() => {
            name = g1.value.name;
        });
        effect(effectCb);

        expect(effectCb).toBeCalledTimes(1);
        expect(name).toBe('test');

        expect(getter1).toBeCalledTimes(1);
        g1.value.name = 'modified';
        expect(getter1).toBeCalledTimes(1);
        expect(effectCb).toBeCalledTimes(2);
        expect(name).toBe('modified');
        expect(g1.value.age).toBe(10);
        expect(g1.value.name).toBe('modified');
    })

    // it('should no longer update when stopped', () => {
    //     const value = reactive<{ foo?: number }>({})
    //     const cValue = computed(() => value.foo)
    //     let dummy
    //     effect(() => {
    //         dummy = cValue.value
    //     })
    //     expect(dummy).toBe(undefined)
    //     value.foo = 1
    //     expect(dummy).toBe(1)
    //     stop(cValue.effect)
    //     value.foo = 2
    //     expect(dummy).toBe(1)
    // })

    // it('should support setter', () => {
    //     const n = ref(1)
    //     const plusOne = computed({
    //         get: () => n.value + 1,
    //         set: val => {
    //             n.value = val - 1
    //         }
    //     })

    //     expect(plusOne.value).toBe(2)
    //     n.value++
    //     expect(plusOne.value).toBe(3)

    //     plusOne.value = 0
    //     expect(n.value).toBe(-1)
    // })

    // it('should trigger effect w/ setter', () => {
    //     const n = ref(1)
    //     const plusOne = computed({
    //         get: () => n.value + 1,
    //         set: val => {
    //             n.value = val - 1
    //         }
    //     })

    //     let dummy
    //     effect(() => {
    //         dummy = n.value
    //     })
    //     expect(dummy).toBe(1)

    //     plusOne.value = 0
    //     expect(dummy).toBe(-1)
    // })

    // it('should warn if trying to set a readonly computed', () => {
    //     const n = ref(1)
    //     const plusOne = computed(() => n.value + 1)
    //         ; (plusOne as WritableComputedRef<number>).value++ // Type cast to prevent TS from preventing the error

    //     expect(
    //         'Write operation failed: computed value is readonly'
    //     ).toHaveBeenWarnedLast()
    // })
})
