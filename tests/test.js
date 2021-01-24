const { computed, readonly, getDepMapInDev, ref, watch, changeProxy, DefineUse, reactive, effect } = require('../dist/index.cjs');
const reactivity = require('../dist/index.cjs');

// const a = ref({age: 10}, undefined, 1);
// const get = () => {
//     // debugger;
//     // @ts-ignore
//     console.log('computed666');
    
//     return a.value.age;
// };
// const b = computed(get, 2);
// let age;
// const fn = () => {
//     console.log('into callback');
//     console.log(reactivity.currentEffect);
//     debugger;
//     age = b.value + 1;
// };
// const watchFn = () => {
//     return b.value;
// };
// watch(watchFn, fn);

// // expect(fn).toBeCalledTimes(0);
// // expect(age).toBe(undefined);
// console.log(getDepMapInDev());
// debugger;
// a.value.age = 11;

// const a = reactivity.reactive({
//     a: 1,
//     b: {
//         b: 2,
//     },
//     c: {
//         c: {
//             c: 2,
//         }
//     },
//     d: {
//         d: {
//             d: {
//                 d: 2
//             }
//         }
//     }
// });
// let c = a.b;

// const compute = computed(() => a.b.b + 2, 'compute');

// let d;
// reactivity.effect(() => {
//     d = a.d.d.d.d + compute.value;
// })
// console.log(d);
// console.log(getDepMapInDev());
// debugger;
// const r = readonly({
//     age: 10,
//     family: {
//         parent: 'object'
//     }
// });


// r.age = 11;

// // expect(r.family).toEqual({parent: 'object'});
// console.log('====');

// r.family.parent = 'parent';

// debugger;
changeProxy(DefineUse);
// const obj = {
//     name: 'test',
//     age: 10,
//     family: {
//         count: 10,
//     },
// };
// const a = reactive(obj);
// console.log(obj);
// console.log(a);


// let age = 0;
// effect(() => {
//     age = a.age;
// });



// a.age = 20;

// debugger;
const s = new Set();
const set = reactive(s);

let a = false;
const udpateA = () => {
    a = set.has('a');
};
console.log(set.size);

debugger;
effect(udpateA);