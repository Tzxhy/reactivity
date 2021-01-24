
import {
    computed,
    // effect,
    // getDepMapInDev,
    // effect,
    // isReactive,
    // markRaw,
    reactive,
    // toRaw,
    ref,
    // computed,
    watch,
    // getDepMapInDev,
} from '../src/index';

describe('watch', () => {
    it('use reactive' , () => {
        const a = reactive({age: 10});
        let age;
        const fn = jest.fn(() => {
            age = a.age
        });
        watch(() => a.age, fn);
        expect(age).toBe(undefined);
        expect(fn).not.toHaveBeenCalled();
        a.age = 1;
        // a.age = 2;
        // console.log(getDepMapInDev());
        
        expect(fn).toHaveBeenCalledTimes(1);
        expect(age).toBe(1);
    });

    it('use ref' , () => {
        const a = ref({age: 10});
        let age;
        const fn = jest.fn(() => {
            age = a.value.age
        });
        watch(() => a.value.age, fn);
        expect(age).toBe(undefined);
        expect(fn).not.toHaveBeenCalled();
        a.value.age = 1;
        // a.age = 2;
        // console.log(getDepMapInDev());
        
        expect(fn).toHaveBeenCalledTimes(1);
        expect(age).toBe(1);
    });

    it('use computed' , () => {
        const a = ref({age: 10}, undefined, Symbol('ref-a'));
        const get = () => {
            // @ts-ignore
            console.log('computed666');
            
            return a.value.age;
        };
        const b = computed(get, Symbol('computed'));
        let age;
        const fn = jest.fn(() => {
            console.log('into callback');
            
            age = b.value + 1;
        });
        const watchFn = () => {
            return b.value;
        };
        watch(watchFn, fn);
        
        expect(fn).toBeCalledTimes(0);
        expect(age).toBe(undefined);

        a.value.age = 11;
        // console.log(getDepMapInDev());
        

        expect(fn).toBeCalledTimes(1);
        expect(age).toBe(12);
        expect(b.value).toBe(11);
    });

});