import {
    reactive,
    DefineUse,
    changeProxy,
    effect,
    computed,
    // effect,
    // isReactive,
    // ref,
    // computed,
    // readonly,
} from '../../src/index';


beforeAll(() => {
    changeProxy(DefineUse);
})

describe.only('reactive with object.define -> map', () => {
    it('normal', () => {
        const m = new Map();
        const map = reactive(m);
        expect(map.size).toBe(0);
        map.set('a', 1);
        expect(map.get('a')).toBe(1);
        expect(map.size).toBe(1);
        map.delete('a')
        expect(map.get('a')).toBe(undefined);
        expect(map.size).toBe(0);
    });

    it('use map with effect', () => {
        const m = new Map();
        const map = reactive(m);

        let a: number = NaN;
        const udpateA = jest.fn(() => {
            a = map.get('a');
        });
        effect(udpateA);

        let size: number = 0;
        const udpateSize = jest.fn(() => {
            size = map.size;
        });
        effect(udpateSize);
        expect(udpateSize).toBeCalledTimes(1);
        expect(size).toBe(0);

        const updateHasB = jest.fn(() => {
            hasB = map.has('b');
        });
        let hasB: boolean = false;
        effect(updateHasB);

        expect(udpateA).toBeCalledTimes(1);
        expect(updateHasB).toBeCalledTimes(1);
        expect(a).toBe(undefined);
        map.set('a', 666);
        expect(udpateSize).toBeCalledTimes(2);
        expect(size).toBe(1);
        expect(udpateA).toBeCalledTimes(2);
        expect(a).toBe(666);

        map.set('a', 777);
        expect(udpateSize).toBeCalledTimes(2);
        expect(size).toBe(1);
        expect(udpateA).toBeCalledTimes(3);
        expect(a).toBe(777);

        map.delete('a');
        expect(udpateSize).toBeCalledTimes(3);
        expect(size).toBe(0);
        expect(udpateA).toBeCalledTimes(4);
        expect(a).toBe(undefined);

        map.set('a', 1);
        expect(udpateSize).toBeCalledTimes(4);
        expect(size).toBe(1);
        expect(udpateA).toBeCalledTimes(5);
        expect(a).toBe(1);

        map.clear();
        expect(udpateSize).toBeCalledTimes(5);
        expect(size).toBe(0);
        expect(udpateA).toBeCalledTimes(6);
        expect(a).toBe(undefined);
        expect(updateHasB).toBeCalledTimes(1);

        map.set('b', 0);
        expect(udpateSize).toBeCalledTimes(6);
        expect(size).toBe(1);
        expect(updateHasB).toBeCalledTimes(2);
        expect(hasB).toBe(true);

        // should not trigger `has`
        map.set('b', 1);
        expect(updateHasB).toBeCalledTimes(2);
        expect(hasB).toBe(true);
    });

    it('use set with effect', () => {
        const s = new Set();
        const set = reactive(s);

        let a: boolean = false;
        const udpateA = jest.fn(() => {
            a = set.has('a');
        });
        effect(udpateA);
        
        const updateSize = jest.fn(() => {
            size = set.size;
        });
        let size: number = 0;
        effect(updateSize);
        expect(updateSize).toBeCalledTimes(1);
        expect(size).toBe(0);

        expect(udpateA).toBeCalledTimes(1);
        expect(updateSize).toBeCalledTimes(1);
        expect(a).toBe(false);
        set.add('a');

        expect(udpateA).toBeCalledTimes(2);
        expect(a).toBe(true);
        expect(updateSize).toBeCalledTimes(2);
        expect(size).toBe(1);

        set.add('b');

        expect(udpateA).toBeCalledTimes(2);
        expect(a).toBe(true);
        expect(updateSize).toBeCalledTimes(3);
        expect(size).toBe(2);

        set.add('a');
        expect(udpateA).toBeCalledTimes(2);
        expect(a).toBe(true);
        expect(updateSize).toBeCalledTimes(3);
        expect(size).toBe(2);

        set.delete('a');
        expect(udpateA).toBeCalledTimes(3);
        expect(a).toBe(false);
        expect(updateSize).toBeCalledTimes(4);
        expect(size).toBe(1);

    });

    it('use map with computed', () => {
        const m = new Map();
        const map = reactive(m);
        const cmpSizeFn = jest.fn(() => map.size);
        const cmpAFn = jest.fn(() => map.get('a'));

        const size = computed(cmpSizeFn);
        const a = computed(cmpAFn);

        expect(cmpSizeFn).toBeCalledTimes(0);
        expect(cmpAFn).toBeCalledTimes(0);
        expect(size.value).toBe(0);
        expect(a.value).toBe(undefined);
        expect(cmpSizeFn).toBeCalledTimes(1);
        expect(cmpAFn).toBeCalledTimes(1);

        map.set('b', 1);

        expect(cmpSizeFn).toBeCalledTimes(1);
        expect(cmpAFn).toBeCalledTimes(1);

        expect(size.value).toBe(1);
        expect(a.value).toBe(undefined);

        expect(cmpSizeFn).toBeCalledTimes(2);
        // cmpAFn should not be trigger cause no `a` changed
        expect(cmpAFn).toBeCalledTimes(1);
        

    });
});