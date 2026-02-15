import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isCodeGenerated, registerCode } from './codeRegistry';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
  };
})();

global.localStorage = localStorageMock;

describe('codeRegistry', () => {
  beforeEach(() => {
    global.localStorage.clear();
  });

  it('should return false for a non-generated code', () => {
    expect(isCodeGenerated('ABC-123')).toBe(false);
  });

  it('should register a code and return true for existence check', () => {
    registerCode('ABC-123');
    expect(isCodeGenerated('ABC-123')).toBe(true);
  });

  it('should handle multiple codes', () => {
    registerCode('CODE-1');
    registerCode('CODE-2');
    expect(isCodeGenerated('CODE-1')).toBe(true);
    expect(isCodeGenerated('CODE-2')).toBe(true);
    expect(isCodeGenerated('CODE-3')).toBe(false);
  });
  
  it('should persist codes to localStorage', () => {
    registerCode('PERSIST-TEST');
    const stored = JSON.parse(global.localStorage.getItem('qr_code_registry'));
    expect(stored).toContain('PERSIST-TEST');
  });
});
