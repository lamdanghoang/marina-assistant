// Entry point — polyfills MUST load before everything else
require('react-native-get-random-values');
require('text-encoding-polyfill');

// Intl.PluralRules (Sui SDK needs it)
if (typeof Intl !== 'undefined' && !Intl.PluralRules) {
  require('intl-pluralrules');
}
if (typeof Intl === 'undefined') { global.Intl = {}; }
if (!Intl.PluralRules) {
  Intl.PluralRules = function() { this.select = function() { return 'other'; }; };
}

// crypto.subtle (Seal SDK needs AES-GCM)
if (!globalThis.crypto || !globalThis.crypto.subtle) {
  if (!globalThis.crypto) globalThis.crypto = {};
  globalThis.crypto.subtle = {
    generateKey: async function(algorithm, extractable, keyUsages) {
      var key = new Uint8Array(algorithm.length / 8);
      crypto.getRandomValues(key);
      return { type: 'secret', algorithm: algorithm, extractable: extractable, usages: keyUsages, _raw: key };
    },
    exportKey: async function(format, key) { return key._raw.buffer; },
    importKey: async function(format, keyData, algorithm, extractable, keyUsages) {
      var raw = keyData instanceof Uint8Array ? keyData : new Uint8Array(keyData);
      return { type: 'secret', algorithm: algorithm, extractable: extractable, usages: keyUsages, _raw: raw };
    },
    encrypt: async function(algorithm, key, data) {
      var gcm = require('@noble/ciphers/aes').gcm;
      return gcm(key._raw, algorithm.iv, algorithm.additionalData).encrypt(new Uint8Array(data)).buffer;
    },
    decrypt: async function(algorithm, key, data) {
      var gcm = require('@noble/ciphers/aes').gcm;
      return gcm(key._raw, algorithm.iv, algorithm.additionalData).decrypt(new Uint8Array(data)).buffer;
    },
  };
}

// crypto.randomUUID
if (!globalThis.crypto.randomUUID) {
  globalThis.crypto.randomUUID = function() {
    var b = new Uint8Array(16);
    crypto.getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    var h = [];
    for (var i = 0; i < 16; i++) h.push(b[i].toString(16).padStart(2, '0'));
    return h.slice(0,4).join('') + '-' + h.slice(4,6).join('') + '-' + h.slice(6,8).join('') + '-' + h.slice(8,10).join('') + '-' + h.slice(10).join('');
  };
}

// AbortSignal.timeout + AbortSignal.any
if (typeof AbortSignal !== 'undefined') {
  if (!AbortSignal.timeout) {
    AbortSignal.timeout = function(ms) {
      var c = new AbortController();
      setTimeout(function() { c.abort(); }, ms);
      return c.signal;
    };
  }
  if (!AbortSignal.any) {
    AbortSignal.any = function(signals) {
      var c = new AbortController();
      for (var i = 0; i < signals.length; i++) {
        var s = signals[i];
        if (s.aborted) { c.abort(s.reason); return c.signal; }
        s.addEventListener('abort', function() { c.abort(s.reason); });
      }
      return c.signal;
    };
  }
}

console.log('Polyfills loaded');
require('expo-router/entry');
