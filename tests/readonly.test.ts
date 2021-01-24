
import {
    // effect,
    // isReactive,
    // markRaw,
    // reactive,
    // toRaw,
    // ref,
    // computed,
    readonly,
} from '../src/index';

describe('readonly with object/array', () => {
    it('with normal object' , () => {
        const r = readonly({
            age: 10,
            family: {
                parent: 'object',
            }
        });
        expect(r.age).toBe(10);
        expect(r.family.parent).toBe('object');

        // modify basis type data
        // @ts-ignore
        r.age = 11;
        expect(r.age).toBe(10);
        expect(r.family).toEqual({parent: 'object'});
        
        r.family.parent = 'parent';
        expect(r.family.parent).toBe('object');
        
        // modify object type data
        // @ts-ignore
        r.family = { name: 'new'};
        expect(r.family.parent).toBe('object');
        expect(r.family).toEqual({parent: 'object'});


        // add a property to object
        // @ts-ignore
        r.family.count = 10;
        // @ts-ignore
        expect(r.family.count).toBe(undefined);

    });

    it('with array' , () => {
        const a = readonly({
            age: 10,
            family: [10, 9, 8],
        });

        // @ts-ignore
        a.family[0] = 0;
        expect(a.family[0]).toBe(10);

        // @ts-ignore
        a.family = [1, 2];
        expect(a.family).toEqual([10, 9, 8]);

        const b = readonly({
            age: 10,
            b: {
                b: {
                    family: [10, 9, 8],
                }
            }
        });

        // @ts-ignore
        b.b.b.family[0] = 0;
        expect(b.b.b.family[0]).toBe(10);

        // @ts-ignore
        b.b.b.family = [1, 2];
        expect(b.b.b.family).toEqual([10, 9, 8]);

        // @ts-ignore
        b.b = {};
        expect(b.b.b.family).toEqual([10, 9, 8]);

    });
});

describe('readonly with Map/Set', () => {
    
});
