import { mapValues } from 'lodash';

exports.tapBindObject = function(obj, ctx){
    return mapValues(obj, function(fn){
        return function(...args){
            return ctx.tap(fn.bind(ctx, ...args));
        };
    });
};

exports.bindObject = function(obj, ctx){
    return mapValues(obj, fn => fn.bind(ctx));
};
