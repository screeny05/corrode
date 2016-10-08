Corrode provides some configuration-options. These are either defaults, safeguards or advanced-user-stuff.

Corrode accepts an object as its first parameter, containing options.

These options also get passed on to the TransformStream-constructor, so [those](https://nodejs.org/api/stream.html#stream_constructor_new_stream_writable_options) [options](https://nodejs.org/api/stream.html#stream_new_stream_readable_options) are also valid.


## `endianness`
**default:** `'LE'`

**accepts:** `'LE', 'BE'` (for little endian & big endian)

If you use methods like `.uint8()` or `.int32()` this option determines what endianness corrode uses when reading your bytes.

Of course using `.uint16be()` or `.doublele()` will overwrite this default, as you'd expect.


## `loopIdentifier`
**default:** `Symbol(loop-variable)`

**accepts:** Anything which can be used as an identifier in an object.

Determines the identifier of the temporary variable which gets created when using `.loop()`.


## `encoding`
**default:** `'utf8'`

**accepts:** Any encoding `Buffer.prototype.toString` accepts. [Full list here](https://nodejs.org/api/buffer.html#buffer_buffers_and_character_encodings).

Determines which encoding to use for string-functions like `.string()` or `.terminatedString()`. Can be overwitten on a per-use-basis by the functions themselves.


## `finishJobsOnEOF`
**default:** `true`

**accepts:** `true, false`

Determines whether or not to finish everything up, once corrode encounters the end of the stream being piped into corrode, or the end of the buffer.

Set to `false` if you want to parse a file which was split in two or more parts. Or somethin along those lines.

What this flag does in detail is to clean up all remaining jobs from the job list, which are read-related, once EOF is reached. Then the job list will be worked on, until there are no more jobs. Meaning all VariableStack-Layers have been popped, giving you access to all that sweet data of yours.


## `anonymousLoopDiscardDeep`
**default:** `false`

**accepts:** `true, false`

Corrode provides the `discard()` function inside `.loop()`- and `.repeat()`-callbacks. If you use those anonymously (meaning you don't push an array onto the variable-stack by giving a string as the first parameter) and then call the `discard()` function, corrode will discard whatever data you read, and restore what's been there before.

By default this is done in a shallow way, meaning that corrode will clone the users data before the callback is called shallowly by using `Object.assign()` and that shallow copy gets assigned again when calling `discard()`.

This may lead to problems, when modifiyng objects within the curren VariableStack-layer. Those won't get replaced with their original version.

To circumvent this problem you can set this option to true. This is not done, because probably no-one needs this, and it may be a huge performance-hit to clone an entire object, everytime the loop-callback is called.


## `strictObjectMode`
**default:** `true`

**accepts:** `true, false`

When this option is set to true, corrode will prevent you from pushing into anything that's not an object. Meaning moves like this:
```javascript
parser.uint8('val').tap('val', function(){});
```
will throw an error. This way corrode provides a naive way of type-safety.
