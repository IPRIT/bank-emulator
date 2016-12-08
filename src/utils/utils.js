import { typeCheck as isType } from 'type-check';

export function parseImageName(imageUrl) {
  let nameRegexp = /\/([a-zA-Z-_.0-9]+\.(?:png|jpe?g|gif|web(?:p|m)|svg))$/i;
  return parseNameFromUrl(imageUrl, nameRegexp);
}

export function parseDocumentName(documentUrl) {
  let nameRegexp = /\/([a-zA-Z-_.0-9]+\.(?:pdf|doc(?:x|m)?|zip|rar|xls(?:x|m)?|rtf|fb2|epub))$/i;
  return parseNameFromUrl(documentUrl, nameRegexp);
}

export function parseNameFromUrl(url, nameRegexp) {
  let nullIterableObject = [ null, null ];
  if (typeof url !== 'string') {
    return nullIterableObject;
  }
  let match = url.match(nameRegexp);
  if (!match) {
    return nullIterableObject;
  }
  let ownHostRegexp = /^(?:https?:\/\/s\.twosphere\.ru)/i;
  let isLocalHost = ownHostRegexp.test(url);
  return [ match[1], isLocalHost ];
}

export class AsyncQueue {
  queue = [];
  inProcess = false;
  
  wait(element, cb) {
    return new Promise(resolve => {
      this.queue.push([ element, cb, resolve ]);
      this.added();
    })
  }
  
  added() {
    if (this.inProcess) {
      return;
    }
    this.process();
  }
  
  async process() {
    this.inProcess = true;
    let queuedElement;
    while (queuedElement = this.queue.shift()) {
      let [ element, process, resolver ] = queuedElement;
      resolver(await process(element));
    }
    this.inProcess = false;
  }
}

export function ensureValue(actual, type, defaultValue, fn = () => {}) {
  const regOppositeExpression = /\^\((.+)\)/i;
  
  let isOppositeType = type.startsWith('^');
  if (isOppositeType) {
    type = type.replace(regOppositeExpression, '$1');
  }
  let isProperlyType = isType(type, actual);
  if (isOppositeType) {
    isProperlyType = !isProperlyType;
  }
  if (!isProperlyType) {
    actual = defaultValue;
  }
  try {
    let regulatedValue = fn(actual, defaultValue);
    return isType('Undefined', regulatedValue) ?
      actual : regulatedValue;
  } catch (err) {
    return defaultValue;
  }
}

export function isCardControlNumberValid(number) {
  if (!(number.length & 1)) {
    let numberArray = number.split('').map(Number);
    for (let i = 0; i < numberArray.length; i += 2) {
      numberArray[i] *= 2;
      if (numberArray[i] > 9) {
        numberArray[i] -= 9;
      }
    }
    let sum = numberArray.reduce((sum, cur) => sum + cur);
    return sum % 10 === 0;
  }
  return false;
}

export function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function cardGenerator(length = 16) {
  return {
    generate: () => {
      const bankMasterCardPrefix = '142438';
      const expirationYears = 2;
  
      const visaPrefixList = [ '4539', '4556', '4916', '4532', '4929', '40240071', '4485', '4716', '4' ];
      const mastercardPrefixList = [ '51', '52', '53', '54', '55' ];
      let prefixes = { visa: visaPrefixList, mastercard: mastercardPrefixList };
  
      let selectedCCType = [ 'visa', 'mastercard' ][ getRandomNumber(0, 1) ];
      let prefix = prefixes[ selectedCCType ][ getRandomNumber(0, prefixes[ selectedCCType ].length - 1) ];
      let completedNumber = prefix;
  
      if (selectedCCType === 'mastercard') {
        completedNumber += bankMasterCardPrefix;
      }
  
      while (completedNumber.length !== length - 1) {
        completedNumber += getRandomNumber(0, 9).toString();
      }
  
      let numberArray = completedNumber.split('').map(Number);
      for (let i = 0; i < numberArray.length; i += 2) {
        numberArray[i] *= 2;
        if (numberArray[i] > 9) {
          numberArray[i] -= 9;
        }
      }
      let sum = numberArray.reduce((sum, cur) => sum + cur);
      let controlNumber = 0;
      
      while ((sum + controlNumber) % 10 !== 0) {
        controlNumber++;
      }
      completedNumber += controlNumber.toString();
      
      let expirationDate = new Date();
      expirationDate.setFullYear(expirationDate.getFullYear() + expirationYears);
      
      return {
        ccType: selectedCCType,
        ccNumber: completedNumber,
        cvv2: getRandomNumber(100, 999),
        ccExpiration: expirationDate
      };
    }
  };
}