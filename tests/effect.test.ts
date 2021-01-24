
import {
    effect,
    // isReactive,
    // markRaw,
    reactive,
    // toRaw,
    // ref,
} from '../src/index';

describe('test effect', () => {

    test('Object', () => {
        const a = reactive({num: 0});
        const b = reactive({num: 0});
        const c = reactive({num: 0});
        effect(() => {
            c.num = b.num;
        })
        effect(() => {
            b.num = a.num;
        });
        expect(c.num).toBe(0);
        a.num = 10;
        expect(c.num).toBe(10);

        b.num = 20;
        expect(c.num).toBe(20);
    });

    


});
