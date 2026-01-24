export function createDiacriticInsensitiveRegex(searchText: string): RegExp {
  const diacriticMap: Record<string, string> = {
    'a': '[aáàäâ]',
    'e': '[eéèëê]',
    'i': '[iíìïî]',
    'o': '[oóòöô]',
    'u': '[uúùüû]',
    'n': '[nñ]',
    'c': '[cç]',    
  };

  const escapedSearch = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  const pattern = escapedSearch
    .split('')
    .map(char => {
      const lowerChar = char.toLowerCase();
      if (diacriticMap[lowerChar]) {
        return diacriticMap[lowerChar];
      }
      
      const upperChar = char.toUpperCase();
      if (char !== lowerChar) {
        return `[${upperChar}${lowerChar}]`;
      }
      return char;
    })
    .join('');

  return new RegExp(pattern, 'i');
}