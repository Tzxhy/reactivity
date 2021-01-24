import {
    reactive,
    DefineUse,
    changeProxy,
    effect,
    isReactive,
    ref,
    computed,
    readonly,
} from '../../src/index';
import { setReactiveKey } from '../../src/proxy-choose/defineProperty/method';

beforeAll(() => {
    changeProxy(DefineUse);
})

describe('reactive with object.define', () => {
    it('reactive', () => {
        const obj = {
            name: 'test',
            age: 10,
            family: {
                count: 10,
            },
        };
        const a = reactive(obj);
        expect(a.name).toBe('test');
        expect(a.age).toBe(10);

        let age: number = 0;
        effect(() => {
            age = a.age;
        });
        expect(age).toBe(10);
        a.age = 20;
        expect(age).toBe(20);
    });

    it('should change original object', () => {
        const obj = {
            name: 'test',
            age: 10,
            family: {
                count: 10,
            },
        };
        const a = reactive(obj);
        expect(isReactive(a)).toBe(true);
        expect(a).not.toBe(obj);
        a.age = 20;
        expect(a.age).toBe(20);
        expect(obj.age).toBe(20);
    });

    it('set a not exist key to a reactive should not be reactive', () => {
        const obj: {
            name: string;
            age: number;
            family: object;
            parent?: object;
        } = {
            name: 'test',
            age: 10,
            family: {
                count: 10,
            },
        };

        const a = reactive(obj);
        expect(isReactive(a.family)).toBe(true);
        expect(isReactive(a.parent)).toBe(false);
        a.parent = {
            father: 'f',
            mather: 'm',
        };
        expect(isReactive(a.parent)).toBe(false);
    });

    it('set a not exist key to a reactive by using \`set\` should be reactive', () => {
        const obj: {
            name: string;
            age: number;
            family: object;
            parent?: object;
        } = {
            name: 'test',
            age: 10,
            family: {
                count: 10,
            },
        };

        const a = reactive(obj);
        expect(isReactive(a.family)).toBe(true);
        expect(isReactive(a.parent)).toBe(false);
        setReactiveKey(a, 'parent', {
            father: 'f',
            mather: 'm',
        });
        expect(isReactive(a.parent)).toBe(true);
    });

    it('with ref', () => {
        const obj: {
            name: string;
            age: number;
            family: object;
            parent?: object;
        } = {
            name: 'test',
            age: 10,
            family: {
                count: 10,
            },
        };

        const a = ref(obj);
        expect(isReactive(a.value.family)).toBe(true);
        expect(isReactive(a.value.parent)).toBe(false);
        setReactiveKey(a.value, 'parent', {
            father: 'f',
            mather: 'm',
        });
        expect(isReactive(a.value.parent)).toBe(true);
    });

    it('with computed', () => {
        const obj: {
            age: number;
        } = {
            age: 10,
        };
        const a = reactive(obj);

        const get = jest.fn(() => a.age * 2);
        const com = computed(get);
        expect(get).toBeCalledTimes(0);
        expect(com.value).toBe(20);
        expect(get).toBeCalledTimes(1);
    });

    it('readonly', () => {
        const obj: {
            age: number;
        } = {
            age: 10,
        };
        const a = readonly(obj);
        // console.log(obj.__is_readonly);

        console.log('a.age', a.age);
        
        const get = jest.fn(() => a.age * 2);
        const com = computed(get);
        expect(get).toBeCalledTimes(0);
        expect(com.value).toBe(20);
        expect(get).toBeCalledTimes(1);
        // @ts-ignore
        a.age = 20;

        expect(get).toBeCalledTimes(1);
        expect(com.value).toBe(20);
        expect(get).toBeCalledTimes(1);
        expect(obj.age).toBe(10);

        // @ts-ignore
        a.count = 1;
        // @ts-ignore
        expect(obj.count).toBe(undefined);
        // BUG can not intercept direct assignment operation
        // @ts-ignore
        expect(a.count).toBe(1);

        setReactiveKey(a, 'count1', 1);
        // @ts-ignore
        expect(obj.count1).toBe(undefined);
        // @ts-ignore
        expect(a.count1).toBe(undefined);

    });

});