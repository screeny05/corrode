import { mapValues } from 'lodash';

/**
 * bind each function in an object with a tap to a given context
 * @param  {object} obj object with functions
 * @param  {object} ctx context
 * @return {object}     copy of object with each function wrapped in a tap
 */
export function tapBindObject(obj, ctx){
    return mapValues(obj, fn => typeof fn === 'function' ? function(...args){
        return ctx.tap(fn.bind(ctx, ...args));
    } : fn);
}

/**
 * bind each function in an object to a given context
 * @param  {object} obj object with functions
 * @param  {object} ctx context
 * @return {object}     copy of object obj with each function bound to ctx
 */
export function bindObject(obj, ctx){
    return mapValues(obj, fn => typeof fn === 'function' ? fn.bind(ctx) : fn);
}
