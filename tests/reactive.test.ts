
import {
    effect,
    isReactive,
    markRaw,
    reactive,
    toRaw,
    ref,
    computed,
} from '../src/index';

describe('reactive', () => {

    test('Object', () => {
        const original = { foo: 1 }
        const observed = reactive(original)
        expect(observed).not.toBe(original)
        expect(isReactive(observed)).toBe(true)
        expect(isReactive(original)).toBe(false)
        // get
        expect(observed.foo).toBe(1)
        // has
        expect('foo' in observed).toBe(true)
        // ownKeys
        expect(Object.keys(observed)).toEqual(['foo'])
    })

    test('proto', () => {
        const obj = {}
        const reactiveObj = reactive(obj)
        expect(isReactive(reactiveObj)).toBe(true)
        // read prop of reactiveObject will cause reactiveObj[prop] to be reactive
        // @ts-ignore
        const prototype = reactiveObj['__proto__']
        const otherObj = { data: ['a'] }
        expect(isReactive(otherObj)).toBe(false)
        const reactiveOther = reactive(otherObj)
        expect(isReactive(reactiveOther)).toBe(true)
        expect(reactiveOther.data[0]).toBe('a')
    })

    test('change a property which proto has should not change proto', () => {
        const proto = Object.create(null);
        proto.name = 'proto-test';
        const obj = Object.create(proto);
        const reactiveObj = reactive(obj)
        expect(isReactive(reactiveObj)).toBe(true);

        expect(reactiveObj.name).toBe(proto.name);

        reactiveObj.name = 'self';
        expect(reactiveObj.name).toBe('self');

        expect(proto.name).toBe('proto-test');
    });


    test('nested reactive', () => {
        const original = {
            nested: {
                foo: 1
            },
            array: [{ bar: 2 }]
        }
        const observed = reactive(original)
        expect(isReactive(observed.nested)).toBe(true)
        expect(isReactive(observed.array)).toBe(true)
        expect(isReactive(observed.array[0])).toBe(true)
    })

    test('observed value should proxy mutations to original (Object)', () => {
        const original: any = { foo: 1 }
        const observed = reactive(original)
        // set
        observed.bar = 1
        expect(observed.bar).toBe(1)
        expect(original.bar).toBe(1)
        // delete
        delete observed.foo
        expect('foo' in observed).toBe(false)
        expect('foo' in original).toBe(false)
    })

    test('setting a property with an unobserved value should wrap with reactive', () => {
        const observed = reactive<{ foo?: object }>({})
        const raw = {}
        observed.foo = raw
        expect(observed.foo).not.toBe(raw)
        expect(isReactive(observed.foo)).toBe(true)
        expect(isReactive(raw)).toBe(false)
    })

    test('observing already observed value should return same Proxy', () => {
        const original = { foo: 1 }
        const observed = reactive(original)
        const observed2 = reactive(observed)
        expect(observed2).toBe(observed)
    })

    test('observing the same value multiple times should return same Proxy', () => {
        const original = { foo: 1 }
        const observed = reactive(original)
        const observed2 = reactive(original)
        expect(observed2).toBe(observed)
    })

    test('should not pollute original object with Proxies', () => {
        const original: any = { foo: 1 }
        const original2 = { bar: 2 }
        const observed = reactive(original)
        const observed2 = reactive(original2)
        observed.bar = observed2
        expect(observed.bar).toBe(observed2)
        expect(original.bar).toBe(original2)
    })

    test('toRaw unwrap reactive', () => {
        const original = { foo: 1 }
        const observed = reactive(original)
        expect(toRaw(observed)).toBe(original)
        expect(toRaw(original)).toBe(original)
    })

    test('markRaw mark not reactive', () => {
        const original: { foo: number; o: { a?: number }; f: { a?: number } } = { foo: 1, o: {}, f: markRaw({}) };
        const observed = reactive(original)
        expect(isReactive(observed)).toBe(true)
        expect(isReactive(observed.o)).toBe(true)
        expect(isReactive(observed.f)).toBe(false)

        const a = jest.fn(() => {
            observed.foo;
        });
        effect(a);
        expect(a).toBeCalledTimes(1);
        observed.foo++;
        expect(a).toBeCalledTimes(2);
        observed.o.a = 1;
        expect(a).toBeCalledTimes(2);
        const b = jest.fn(() => {
            observed.o;
        });
        effect(b);
        expect(b).toBeCalledTimes(1);
        observed.o.a = 2;
        expect(b).toBeCalledTimes(1);
        expect(a).toBeCalledTimes(2);

        const c = jest.fn(() => {
            observed.o.a;
        });
        effect(c);
        expect(c).toBeCalledTimes(1);
        observed.o.a = 3;
        expect(c).toBeCalledTimes(2);

        const d = jest.fn(() => {
            observed.f.a;
        });
        const e = jest.fn(() => {
            observed.f;
        });
        effect(d);
        effect(e);
        expect(d).toBeCalledTimes(1);
        expect(e).toBeCalledTimes(1);
        observed.f.a = 1;
        expect(d).toBeCalledTimes(1);
        expect(e).toBeCalledTimes(1);

        observed.f.a = 2;
        expect(d).toBeCalledTimes(1);
        expect(e).toBeCalledTimes(1);

        // change a raw to reactive, trigger d & e.
        observed.f = {};
        expect(d).toBeCalledTimes(2);
        expect(e).toBeCalledTimes(2);
    })

    test('should not unwrap Ref<T>', () => {
        const refa = ref(1);
        const observedNumberRef = reactive(refa);

        const refb = ref({ foo: 1 });
        const observedObjectRef = reactive(refb);

        expect(observedNumberRef).toBe(refa);
        expect(observedObjectRef).toBe(refb);
        expect(observedNumberRef.value).toBe(1);
        expect(observedObjectRef.value.foo).toBe(1);
    })

    it('should not wrap computed', () => {

        const _ref = ref(1);
        const cmp = computed(() => _ref.value);
        expect(cmp.value).toBe(1);

        _ref.value = 10;
        expect(cmp.value).toBe(10);

        const cmpR = reactive(cmp);
        expect(cmpR).toBe(cmp);
        expect(cmpR.value).toBe(10);
    });

    it('use effect', () => {
        const obj = reactive({ a: 1 });
        let outer = 0;
        effect(() => {
            outer = obj.a;
        });
        expect(outer).toBe(1);
        obj.a = 2;
        expect(outer).toBe(2);
    });

    it('use effect with nested obj', () => {
        const obj = reactive({ a: { b: { c: 2 } }, b: 1, c: 0 });
        let outer = 0;
        const get = jest.fn(() => {
            outer = obj.b + obj.a.b.c;
        });
        effect(get);
        expect(get).toBeCalledTimes(1);
        expect(outer).toBe(3);
        obj.a.b.c = 4;
        expect(get).toBeCalledTimes(2);
        expect(outer).toBe(5);

        obj.b = 6;
        expect(get).toBeCalledTimes(3);
        expect(outer).toBe(10);

        obj.c = 6;
        expect(get).toBeCalledTimes(3);
        expect(outer).toBe(10);
    });

    it('changed to a same value should not trigger effect', () => {
        const obj = reactive({ a: 1 });
        let outer = 0;
        const updateFunc = jest.fn(() => {
            outer = obj.a;
        });
        effect(updateFunc);
        expect(outer).toBe(1);
        expect(updateFunc).toBeCalledTimes(1)
        obj.a = 1;
        expect(outer).toBe(1);
        expect(updateFunc).toBeCalledTimes(1)
    });

    it('should recapture all dep in effect', () => {
        const obj = reactive({ a: 1, s: false });
        let outer = 0;
        let i = 0;
        const updateFunc = jest.fn(() => {
            outer = obj.s ? obj.a : ++i;
        });
        effect(updateFunc);
        expect(outer).toBe(1);
        expect(updateFunc).toBeCalledTimes(1)
        obj.a += 9;
        expect(outer).toBe(1);
        expect(updateFunc).toBeCalledTimes(1)

        obj.s = true;
        expect(outer).toBe(10);
        expect(updateFunc).toBeCalledTimes(2)

        obj.a += 1;
        expect(outer).toBe(11);
        expect(updateFunc).toBeCalledTimes(3)
    });

    it('reactive basic data type throw error', () => {
        const generate1 = () => reactive(1 as any);
        const s = Symbol('test');
        const generate2 = () => reactive(s as any);
        const generate3 = () => reactive('test' as any);
        // @ts-ignore
        const generate4 = () => reactive(10n as any);
        const generate5 = () => reactive(true as any);
        const generate6 = () => reactive(null as any);
        const generate7 = () => reactive(undefined as any);

        expect(generate1()).toBe(1);
        expect(generate2()).toBe(s);
        expect(generate3()).toBe('test');
        // @ts-ignore
        expect(generate4()).toBe(10n);
        expect(generate5()).toBe(true);
        expect(generate6()).toBe(null);
        expect(generate7()).toBe(undefined);
    });



    it('multi data type', () => {

        const _ref = ref(2);
        const get = jest.fn(() => _ref.value + 1);
        const cmp = computed(get);
        expect(get).toBeCalledTimes(0);
        const obj = reactive({
            name: 'test',
            age: computed(() => cmp.value),
            o: {
                age: computed(() => cmp.value + 2),
            },
            r: ref(66),
        });
        expect(get).toBeCalledTimes(0);

        expect(obj.age.value).toBe(3);
        expect(get).toBeCalledTimes(1);
        expect(obj.o.age.value).toBe(5);
        expect(get).toBeCalledTimes(1);

        _ref.value = 10;
        expect(get).toBeCalledTimes(1);
        expect(obj.age.value).toBe(11);
        expect(get).toBeCalledTimes(2);
        expect(obj.o.age.value).toBe(13);
        expect(get).toBeCalledTimes(2);

        expect(obj.r.value).toBe(66);
        let time;
        effect(() => {
            time = obj.r.value;
        });
        expect(time).toBe(66);
        obj.r.value = 77;
        expect(time).toBe(77);
    });

    it('reactive with array', () => {
        const reac = reactive({
            a: [1, 2, 3],
            b: {
                name: 'test',
            },
        });

        let arr;
        effect(() => {
            // console.log('enter effect');

            arr = reac.a;
        });

        expect(arr).toEqual([1, 2, 3]);
        reac.a = [4, 5];
        expect(arr).toEqual([4, 5]);
        let a0;
        effect(() => {
            // console.log('enter effect[0]');

            a0 = reac.a[0];
        });
        expect(a0).toBe(4);
        reac.a[0] = 1;
        expect(a0).toBe(1);
    });

    it('change reactive in effect', () => {

        const rea = reactive({
            a: [1, 2, 3],
            b: {
                name: 'test',
            },
        });

        let a;
        const update = jest.fn(() => {
            a = rea.b.name;

            // be careful with this case: 
            // need a escape way to prevent dead loop.
            if (rea.a[1] === 10) {
                rea.a[1] += 1;
            }
        });
        effect(update);
        expect(update).toBeCalledTimes(1);
        expect(a).toBe('test');
        expect(rea.a[1]).toBe(2);

        // should not trigger update
        rea.a[0] = 0;
        expect(update).toBeCalledTimes(1);
        expect(a).toBe('test');
        expect(rea.a[1]).toBe(2);

        rea.a[1] = 8;
        expect(update).toBeCalledTimes(2);
        expect(rea.a[1]).toBe(8);


        rea.a[1] = 10;
        expect(update).toBeCalledTimes(4);
        expect(rea.a[1]).toBe(11);
    });

});


describe('readonly reactive', () => {

});

describe('reactive collections', () => {
    it('with array', () => {
        const obj = reactive([9, 8, 7]);
        expect(isReactive(obj)).toBe(true);

        const refa = ref(10);
        const get = jest.fn(() => refa.value + obj[1]);
        const cmp = computed(get);
        expect(get).toBeCalledTimes(0);
        expect(cmp.value).toBe(18);
        expect(get).toBeCalledTimes(1);

        expect(cmp.value).toBe(18);
        expect(cmp.value).toBe(18);
        expect(cmp.value).toBe(18);
        expect(get).toBeCalledTimes(1);

        refa.value = 11;
        expect(get).toBeCalledTimes(1);
        expect(cmp.value).toBe(19);
        expect(get).toBeCalledTimes(2);

        // should not trigger
        obj[0] = 0;
        expect(get).toBeCalledTimes(2);
        expect(cmp.value).toBe(19);
        expect(get).toBeCalledTimes(2);

    });

    it('with Map', () => {
        const obj = reactive(new Map());

        obj.set('a', 1);
        expect(obj.get('a')).toBe(1);
        let a;
        effect(() => {
            a = obj.get('a') + 1;
        });
        expect(a).toBe(2);

        obj.set('a', 2);
        expect(obj.get('a')).toBe(2);
        expect(a).toBe(3);

        let _has: boolean = false;
        effect(() => {
            _has = obj.has('a');
        });
        expect(_has).toBe(true);
        expect(obj.size).toBe(1)

        obj.delete('a');
        expect(obj.size).toBe(0)
        expect(_has).toBe(false);
    });

    it('with Set', () => {
        const obj = reactive(new Set());
        const key = { name: 'test' };
        obj.add(key);
        // console.log(obj);

        expect(obj.has(key)).toBe(true);
        let a;
        effect(() => {
            // console.log('effect');
            a = obj.has(key);
        });
        expect(a).toBe(true);

        // console.log('delete');

        obj.delete(key);
        expect(a).toBe(false);
        obj.add(key);
        let _has: boolean = false;
        effect(() => {
            _has = obj.has(key);
        });
        expect(_has).toBe(true);
        obj.delete(key);
        expect(_has).toBe(false);
    });

    it('with WeakMap', () => {
        const obj = reactive(new WeakMap());
        const key = {};
        obj.set(key, 1);
        expect(obj.get(key)).toBe(1);
        let a;
        effect(() => {
            a = obj.get(key) + 1;
        });
        expect(a).toBe(2);

        obj.set(key, 2);
        expect(a).toBe(3);
        let _has: boolean = false;
        effect(() => {
            _has = obj.has(key);
        });
        expect(_has).toBe(true);
        obj.delete(key);
        expect(_has).toBe(false);
    });

    it('with WeakSet', () => {
        const obj = reactive(new Set());
        const key = {};
        obj.add(key);
        expect(obj.has(key)).toBe(true);
        let a;
        effect(() => {
            a = obj.has(key);
        });
        expect(a).toBe(true);

        obj.delete(key);
        expect(a).toBe(false);
        obj.add(key);
        let _has: boolean = false;
        effect(() => {
            _has = obj.has(key);
        });
        expect(_has).toBe(true);
        obj.delete(key);
        expect(_has).toBe(false);
    });
    it('should not observe custom property mutations', () => {
        let dummy
        const map: any = reactive(new Map())
        effect(() => (dummy = map.customProp))

        expect(dummy).toBe(undefined)
        map.customProp = 'Hello World'
        expect(dummy).toBe(undefined)
    })

    it('should not observe non value changing mutations', () => {
        let dummy
        const map = reactive(new Map())
        const mapSpy = jest.fn(() => (dummy = map.get('key')))
        effect(mapSpy)

        expect(dummy).toBe(undefined)
        expect(mapSpy).toHaveBeenCalledTimes(1)
        map.set('key', undefined)
        expect(dummy).toBe(undefined)
        expect(mapSpy).toHaveBeenCalledTimes(2)
        map.set('key', 'value')
        expect(dummy).toBe('value')
        expect(mapSpy).toHaveBeenCalledTimes(3)

        map.set('key', 'value')
        expect(dummy).toBe('value')
        expect(mapSpy).toHaveBeenCalledTimes(3)
        expect(map.size).toBe(1);

        map.delete('key')
        expect(map.size).toBe(0);
        expect(dummy).toBe(undefined)
        expect(mapSpy).toHaveBeenCalledTimes(4)
        map.delete('key')
        expect(dummy).toBe(undefined)
        expect(mapSpy).toHaveBeenCalledTimes(4)

        map.set('key', 'v');
        expect(dummy).toBe('v')
        expect(mapSpy).toHaveBeenCalledTimes(5)

        map.clear()
        expect(mapSpy).toHaveBeenCalledTimes(6)
        expect(dummy).toBe(undefined)
    });

    it('reactive with map', () => {
        let dummy
        const map = reactive(new Map())
        const mapSpy = jest.fn(() => (dummy = map.get('key')))
        effect(mapSpy)

        map.set('key', {age: 10});
        expect(dummy).toEqual({age: 10})

        let age;
        const ageSpy = jest.fn(() => age = map.get('key')?.age);
        effect(ageSpy);
        expect(age).toBe(10);
        map.get('key').age = 20;
        expect(age).toBe(20);
    });

    it('proxy map with all methods', () => {
        let dummy
        const map = reactive(new Map())
        const mapGetSpy = jest.fn(() => (dummy = map.get('key')))
        effect(mapGetSpy)
        expect(dummy).toBe(undefined);
        expect(mapGetSpy).toBeCalledTimes(1);

        let a;
        const mapGetASpy = jest.fn(() => (a = map.get('a')))
        effect(mapGetASpy)
        expect(a).toBe(undefined);

        let size;
        const mapSizeSpy = jest.fn(() => (size = map.size))
        effect(mapSizeSpy)
        expect(size).toBe(0);
        expect(mapSizeSpy).toBeCalledTimes(1);
        expect(mapGetSpy).toBeCalledTimes(1);

        map.set('a', 1);
        expect(size).toBe(1);
        expect(mapSizeSpy).toBeCalledTimes(2);
        expect(mapGetSpy).toBeCalledTimes(1);
        expect(mapGetASpy).toBeCalledTimes(2);

        map.set('b', 1);
        expect(size).toBe(2);
        expect(mapSizeSpy).toBeCalledTimes(3);
        expect(mapGetSpy).toBeCalledTimes(1);
        expect(mapGetASpy).toBeCalledTimes(2);

        map.clear();
        expect(size).toBe(0);
        expect(mapSizeSpy).toBeCalledTimes(4);
        expect(dummy).toBe(undefined);
        expect(mapGetASpy).toBeCalledTimes(3);

        let keys;
        const spyGetKeys = jest.fn(() => keys = [...map.keys()]);
        effect(spyGetKeys);
        expect(spyGetKeys).toBeCalledTimes(1);
        expect(keys).toEqual([]);

        let values;
        const spyGetValues = jest.fn(() => values = [...map.values()]);
        effect(spyGetValues);
        expect(spyGetValues).toBeCalledTimes(1);
        expect(values).toEqual([]);

        let forEachValue: any;
        const spyGetForEach = jest.fn(() => {
            const temp: any = [];
            map.forEach((value, key) => {
                temp.push({key, value})
            });
            forEachValue = temp;
        });
        effect(spyGetForEach);
        expect(spyGetForEach).toBeCalledTimes(1);
        expect(forEachValue).toEqual([]);

        let entriesValue: any;
        const spyGetEntries = jest.fn(() => {
            const temp: any = [];
            for (const [key, value] of map.entries()) {
                temp.push({key, value})
            }
            entriesValue = temp;
        });
        effect(spyGetEntries);
        expect(spyGetEntries).toBeCalledTimes(1);
        expect(entriesValue).toEqual([]);

        map.set('a', 666);

        expect(spyGetKeys).toBeCalledTimes(2);
        expect(keys).toEqual(['a']);
        expect(spyGetValues).toBeCalledTimes(2);
        expect(values).toEqual([666]);
        expect(spyGetForEach).toBeCalledTimes(2);
        expect(forEachValue).toEqual([{key: 'a', value: 666}]);

        expect(spyGetEntries).toBeCalledTimes(2);
        expect(entriesValue).toEqual([{key: 'a', value: 666}]);

        map.delete('a');
        // duplicated delete will not trigger
        map.delete('a');
        // delete a key which not exist
        map.delete('b');

        expect(spyGetKeys).toBeCalledTimes(3);
        expect(keys).toEqual([]);
        expect(spyGetValues).toBeCalledTimes(3);
        expect(values).toEqual([]);
        expect(spyGetForEach).toBeCalledTimes(3);
        expect(forEachValue).toEqual([]);
        expect(spyGetEntries).toBeCalledTimes(3);
        expect(entriesValue).toEqual([]);
    });

    it('proxy set with all methods', () => {
        let dummy
        const set = reactive(new Set())
        const mapGetSpy = jest.fn(() => (dummy = set.has('key')))
        effect(mapGetSpy)
        expect(dummy).toBe(false);
        expect(mapGetSpy).toBeCalledTimes(1);

        let a;
        const mapGetASpy = jest.fn(() => (a = set.has('a')))
        effect(mapGetASpy)
        expect(mapGetASpy).toBeCalledTimes(1);
        expect(a).toBe(false);

        let size;
        const mapSizeSpy = jest.fn(() => (size = set.size))
        effect(mapSizeSpy)
        expect(size).toBe(0);
        expect(mapSizeSpy).toBeCalledTimes(1);
        expect(mapGetSpy).toBeCalledTimes(1);

        set.add('a');
        expect(size).toBe(1);
        expect(mapSizeSpy).toBeCalledTimes(2);
        expect(mapGetSpy).toBeCalledTimes(1);
        expect(mapGetASpy).toBeCalledTimes(2);

        set.add('b');
        expect(size).toBe(2);
        expect(mapSizeSpy).toBeCalledTimes(3);
        expect(mapGetSpy).toBeCalledTimes(1);
        expect(mapGetASpy).toBeCalledTimes(2);

        set.clear();
        expect(size).toBe(0);
        expect(mapSizeSpy).toBeCalledTimes(4);
        expect(dummy).toBe(false);
        expect(mapGetASpy).toBeCalledTimes(3);

        let keys;
        const spyGetKeys = jest.fn(() => keys = [...set.keys()]);
        effect(spyGetKeys);
        expect(spyGetKeys).toBeCalledTimes(1);
        expect(keys).toEqual([]);

        let values;
        const spyGetValues = jest.fn(() => values = [...set.values()]);
        effect(spyGetValues);
        expect(spyGetValues).toBeCalledTimes(1);
        expect(values).toEqual([]);

        let forEachValue: any;
        const spyGetForEach = jest.fn(() => {
            const temp: any = [];
            set.forEach((value, key) => {
                temp.push({key, value})
            });
            forEachValue = temp;
        });
        effect(spyGetForEach);
        expect(spyGetForEach).toBeCalledTimes(1);
        expect(forEachValue).toEqual([]);

        let entriesValue: any;
        const spyGetEntries = jest.fn(() => {
            const temp: any = [];
            for (const [key, value] of set.entries()) {
                temp.push({key, value})
            }
            entriesValue = temp;
        });
        effect(spyGetEntries);
        expect(spyGetEntries).toBeCalledTimes(1);
        expect(entriesValue).toEqual([]);

        set.add('a');

        expect(spyGetKeys).toBeCalledTimes(2);
        expect(keys).toEqual(['a']);
        expect(spyGetValues).toBeCalledTimes(2);
        expect(values).toEqual(['a']);
        expect(spyGetForEach).toBeCalledTimes(2);
        expect(forEachValue).toEqual([{key: 'a', value: 'a'}]);

        expect(spyGetEntries).toBeCalledTimes(2);
        expect(entriesValue).toEqual([{key: 'a', value: 'a'}]);

        set.delete('a');
        // duplicated delete will not trigger
        set.delete('a');
        // delete a key which not exist
        set.delete('b');

        expect(spyGetKeys).toBeCalledTimes(3);
        expect(keys).toEqual([]);
        expect(spyGetValues).toBeCalledTimes(3);
        expect(values).toEqual([]);
        expect(spyGetForEach).toBeCalledTimes(3);
        expect(forEachValue).toEqual([]);
        expect(spyGetEntries).toBeCalledTimes(3);
        expect(entriesValue).toEqual([]);
    });
});
