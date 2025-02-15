import type { UserWallet } from '@prisma/client';
import { utils, Wallet } from 'ethers';

import { randomETHWalletAddress } from 'testing/generate-stubs';

import { conditionalPlural, matchWalletAddress, sanitizeForRegex, shortenHex, shortWalletAddress } from '../strings';

describe('strings', () => {
  it('should sanitize parenthesis in a regex', () => {
    const text = sanitizeForRegex('test (test)');

    expect(text).toBe('test \\(test\\)');
  });
});

describe('conditionalPlural', () => {
  it('should return the word if the number is 1', () => {
    expect(conditionalPlural({ word: 'test', count: 1 })).toBe('test');
  });
  it('should append the letter "s" to a word if the number if not 1', () => {
    expect(conditionalPlural({ word: 'test', count: 2 })).toBe('tests');
  });

  it('should return plural if provided and the number is not 1', () => {
    expect(conditionalPlural({ word: 'Identity', count: 2, plural: 'Identities' })).toBe('Identities');
  });
});

describe('shortWalletAddress', () => {
  it('should shorten valid wallet addresses', () => {
    const address = randomETHWalletAddress();
    const shortAddress = shortWalletAddress(address);
    expect(shortAddress).toBe(shortenHex(address));
    expect(shortAddress.length).toBe(11);
  });

  it('should return a lowercase string', () => {
    const addressWithMixedCase = Wallet.createRandom().address;

    const shortAddress = shortWalletAddress(addressWithMixedCase);
    expect(!!shortAddress.match(/[A-Z]/)).toBe(false);
  });

  it('should leave other strings unchanged', () => {
    const ignoredString = 'test';
    const invalidWallet = '0x123abc';

    expect(shortWalletAddress(ignoredString)).toBe(ignoredString);
    expect(shortWalletAddress(invalidWallet)).toBe(invalidWallet);
  });
});
describe('matchShortAddress', () => {
  it('should return true if the first argument is a valid short version of the wallet address', () => {
    const address = randomETHWalletAddress();
    const shortAddress = shortWalletAddress(address);

    expect(shortAddress.length).toBeLessThan(address.length);

    expect(matchWalletAddress(shortAddress, address)).toBe(true);
  });

  it('should support a wallet as input, allowing comparison with ensname', () => {
    const address = randomETHWalletAddress();
    const ensname = 'test-name.eth';

    const wallet: Pick<UserWallet, 'address' | 'ensname'> = {
      address,
      ensname
    };

    const shortAddress = shortWalletAddress(address);

    expect(matchWalletAddress(shortAddress, wallet)).toBe(true);
    expect(matchWalletAddress(ensname, wallet)).toBe(true);
    expect(matchWalletAddress(address, wallet)).toBe(true);

    // Quick test to ensure that wallet doesn't give bad results
    expect(matchWalletAddress(randomETHWalletAddress(), wallet)).toBe(false);
  });

  it('should return true if the first argument is a short, or full lower / mixed case version of the wallet address', () => {
    const address = randomETHWalletAddress();

    const withMixedCase = utils.getAddress(address);

    const shortAddress = shortWalletAddress(address);

    expect(address !== withMixedCase).toBe(true);

    expect(matchWalletAddress(shortAddress, address)).toBe(true);
    expect(matchWalletAddress(shortAddress, withMixedCase)).toBe(true);
    expect(matchWalletAddress(withMixedCase, address)).toBe(true);
    expect(matchWalletAddress(address, address)).toBe(true);
  });

  it('should return false if these do not match', () => {
    const address = randomETHWalletAddress();
    const shortAddress = shortWalletAddress(address).slice(0, 5);
    expect(matchWalletAddress(shortAddress, address)).toBe(false);
  });

  it('should return false if the second argument is not a valid wallet address', () => {
    const address = randomETHWalletAddress();

    const alteredAddress = address.slice(0, 20);

    expect(matchWalletAddress(address, alteredAddress)).toBe(false);
  });
  it('should return false if the input is undefined', () => {
    expect(matchWalletAddress('123', undefined as any)).toBe(false);
    expect(matchWalletAddress(null as any, null as any)).toBe(false);
  });
});
