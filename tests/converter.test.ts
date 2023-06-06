import { INITIALIZATON_VECTOR, SECURITY_KEY } from '../src/keys.js';
import { Block } from '../src/blockchain.js';
import { Converter } from '../src/converter.js';

describe('Converter', () => {
  describe('Block', () => {
    test('blockToPredictableString accepts a block and formats a string output correctly', () => {
      const testBlock: Block = {
        index: 0,
        nonce: 22,
        previousHashedBlock: 'hash',
        transactions: [{ token: { id: '1' }, id: '1', recipient: 'one', vendor: 'two' }],
      };
      const stringVersion = `index=0,previousHashedBlock=hash,nonce=22,transactions=v=two&r=one&token.id=1&id=1`;
      expect(Converter.Block.blockToPredictableString(testBlock)).toEqual(stringVersion);
    });
    test('predictableStringToBlock accepts a string and returns a block', () => {
      const stringBlock = `index=0,previousHashedBlock=hash,nonce=22,transactions=v=two&r=one&token.id=1&id=1`;;
      const testBlock: Block = {
        index: 0,
        nonce: 22,
        previousHashedBlock: 'hash',
        transactions: [{ token: { id: '1' }, id: '1', recipient: 'one', vendor: 'two' }],
      };
      expect(Converter.Block.predictableStringToBlock(stringBlock)).toStrictEqual(testBlock);
    });
  });
  describe('Hasher', () => {
    test('encrypts and decrypts a target string', () => {
        const hasher = new Converter.Hasher(SECURITY_KEY, INITIALIZATON_VECTOR);
        const cleanString = 'maggie_simpson';
        const hashedString = hasher.encrypt(cleanString);
        expect(hashedString).not.toEqual(cleanString);
        const unhashedString = hasher.decrypt(hashedString);
        expect(unhashedString).toEqual(cleanString);
    })
  })
});
