# Overview

## Components
Corrode consists of 5 components:
1. The [VariableStack](https://doc.esdoc.org/github.com/screeny05/corrode/class/src/variable-stack.js~VariableStack.html). It handles all things variables when reading data, pushing structures and looping bytes.
2. The [CorrodeBase](https://doc.esdoc.org/github.com/screeny05/corrode/class/src/base.js~CorrodeBase.html). This is the part of corrode, reading all bytes. It's the low-level part handling all the small things, preventing you from shooting yourself into the foot. Of course, it also enables you to do just that, if you explicitly ask for it.
3. The [Assertions](). Just like your assertion-library of choice these ensure you read correct data. If not it will abort mission.
4. The [Mappers](). Doing all the bulk parts of work for you, the mappers ensure your data is in the way you need it to be. Think of these like JavaScripts Array.prototype.map. Except for bits and bytes.
5. Corrode itself. This is the only thing you - as a developer - are directly in contact with. It connects The CorrodeBase with the Assertions and Mappers to provide a unified interface.

For more info on each of those see the Reference.

For info on ways to configure corrode to your liking, see Configuration.

## The Assertions
Asserts help you to make sure, the buffer you're parsing is in the correct format.
These assertions are like chai, throwing an error when an assertion doesn't hold.

These functions won't modify your variables.

All assertions can be called from a Corrode instance like this:
```javascript
parser.assert.equal('var', 5);
```


## The Mappers
These functions provide basic mapping-abilities for Corrode's VariableStack.

Imagine them like this:
```javascript
const parser = new Corrode();
parser.uint8('value').map.double('value');
```

Of course there's no existing mapping-function which doubles a value (yet?).
But the concept is that they are functions receiving a value, processing it
and saving a new value in the {@link VariableStack} in place of the old one.

The imaginary code above would yield `{ value: 4 }`, parsing a buffer like this `[2]`.

Note that all mappers don't check for existance, validity or other assumptions.
You have to do that yourself with assertions.


## When will i be able to access the variables? (Extensions, Asserts & Mappers)

## Corrode#position / Corrode#skip issues (isSeeking)
