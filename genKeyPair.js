var EC = require('elliptic').ec;

// Create and initialize EC context
// (better do it once and reuse it)
var ec = new EC('secp256k1');

var key = ec.genKeyPair();

console.log({
    pub: key.getPublic().encode('hex'),
    pri: key.getPrivate('hex')
})