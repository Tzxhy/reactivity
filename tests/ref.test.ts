
import {
    effect,
    // isReactive,
    // markRaw,
    reactive,
    toRaw,
    ref,
} from '../src/index';

describe('ref', () => {


    it('reactive', () => {
        const r = ref(1);
        expect(r.value).toBe(1);
        r.value = 2;
        expect(r.value).toBe(2);
    });

    it('reactive with effect', () => {
        const r = ref(1);
        expect(r.value).toBe(1);
        let a = 0;
        effect(() => {
            a = r.value;
        });
        expect(a).toBe(1);
        r.value = 9;
        expect(r.value).toBe(9);
        expect(a).toBe(9);
    }); 
    
    it('should be reactive', () => {
        const a = ref(1)
        let dummy
        let calls = 0
        effect(() => {
            calls++
            dummy = a.value
        })
        expect(calls).toBe(1)
        expect(dummy).toBe(1)
        a.value = 2
        expect(calls).toBe(2)
        expect(dummy).toBe(2)
        // same value should not trigger
        a.value = 2
        expect(calls).toBe(2)
        expect(dummy).toBe(2)
    })

    it('should make nested properties reactive', () => {
        const a = ref({
            count: 1
        })
        let dummy
        effect(() => {
            dummy = a.value.count
        })
        expect(dummy).toBe(1)
        a.value.count = 2
        expect(dummy).toBe(2)
    })

    it('reactive a ref should return this ref', () => {
        const a = ref(1);
        const b = reactive(a);
        expect(b).toBe(a);
    });

    it('with proto', () => {
        const proto = Object.create(null);
        proto.name = 'proto';
        const a = ref(Object.create(proto));
        const b = reactive(a);
        expect(b).toBe(a);
        expect(b.value.name).toBe('proto');
        b.value.name = 'self';
        expect(b.value.name).toBe('self');
        expect(proto.name).toBe('proto');
    })

    it('with effect', () => {
        const a = ref(1);
        const b = reactive({
            name: 'reactive',
            age: 10,
        });
        expect(a.value).toBe(1);
        effect(() => {
            a.value = b.age;
        });
        expect(a.value).toBe(10);
        b.age = 20;
        expect(a.value).toBe(20);
    })

    it('change ref\'s value into an observable', () => {
        const a = ref<any>(1);

        expect(a.value).toBe(1);

        let e: any;
        effect(() => {
            e = a.value;
        });

        expect(e).toBe(1);
        const o = {
            age: 10,
            name: 21,
        };
        a.value = o;
        expect(a.value.age).toBe(10);
        expect(toRaw(e)).toBe(o);
    });

    // it('change .value should error', () => {
    //     const r = ref(1);
    // });

});

