import './style.css';
import typescriptLogo from './typescript.svg';
import viteLogo from '/vite.svg';
import { setupCounter } from './counter.ts';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <a href="https://vitejs.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
      <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
    </a>
    <h1>Vite + TypeScript</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    
    <div id="timer">
  <span id="day"></span>
  <span id="hours"></span>
  <span id="minutes"></span>
  <span id="seconds"></span>
  <span id="milliseconds"></span>
</div>
  </div>
`;

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!);

// coreTimer.ts

type TimeUnit = 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days';

interface TimerOptions {
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  milliseconds?: number;
  locale?: 'ru' | 'en';
  showWords?: boolean;
  sep?: string;
  leadingZeros?: boolean;
}

interface TimerInstance {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
  toString: () => string;
  start: (callback?: () => void) => void;
  stop: () => void;
  getTime: () => {
    days: string | number;
    hours: string | number;
    minutes: string | number;
    seconds: string | number;
    milliseconds: string;
    daysWord: string;
    hoursWord: string;
    minutesWord: string;
    secondsWord: string;
    millisecondsWord: string;
  };
}

const localization = {
  ru: {
    days: ['день', 'дня', 'дней'],
    hours: ['час', 'часа', 'часов'],
    minutes: ['минута', 'минуты', 'минут'],
    seconds: ['секунда', 'секунды', 'секунд'],
    milliseconds: ['миллисекунд'],
  },
  en: {
    days: ['day', 'days'],
    hours: ['hour', 'hours'],
    minutes: ['minute', 'minutes'],
    seconds: ['second', 'seconds'],
    milliseconds: ['milliseconds'],
  },
};

export const coreTimer = (options: TimerOptions): TimerInstance => {
  const {
    days = 0,
    hours = 0,
    minutes = 0,
    seconds = 0,
    milliseconds = 0,
    locale = 'en',
    showWords = false,
    sep = ' ',
    leadingZeros = false,
  } = options;

  const timeLeft: Record<TimeUnit, number> = {
    days,
    hours,
    minutes,
    seconds,
    milliseconds,
  };

  let interval: ReturnType<typeof setInterval> | undefined;
  let millisecondInterval: ReturnType<typeof setInterval> | undefined;
  const units: TimeUnit[] = ['seconds', 'minutes', 'hours', 'days'];
  
  const formatNumberWithLeadingZeros = (
    value: number,
    digits: number
  ): string => {
    let result = value.toString();
    while (result.length < digits) {
      result = '0' + result;
    }
    return result;
  };

  const getMaxWordLength = (words: string[]) => {
    return Math.max(...words.map((word) => word.length));
  };

  const padWord = (word: string, maxLength: number) => {
    while (word.length < maxLength) {
      word += '\u00A0';
    }
    return word;
  };
  
  const getWordForm = (value: number, words: string[], maxLength: number) => {
    let chosenWord = '';
    
    if (words.length === 1) {
        return padWord(words[0], maxLength);
    }

    if (locale === 'ru') {
        const lastDigit = value % 10;
        const lastTwoDigits = value % 100;

        if (lastDigit === 1 && lastTwoDigits !== 11) chosenWord = words[0];
        else if (lastDigit >= 2 && lastDigit <= 4 && ![12, 13, 14].includes(lastTwoDigits))
            chosenWord = words[1];
        else chosenWord = words[2];
    } else {
        chosenWord = value === 1 ? words[0] : words[1];
    }

    return padWord(chosenWord, maxLength);
};


  const update = () => {
    let carry = -1;
    for (let unit of units) {
      timeLeft[unit] += carry;
      carry = 0;
      if (timeLeft[unit] < 0) {
        carry = -1;
        timeLeft[unit] =
          unit === 'seconds'
            ? 59
            : unit === 'minutes'
            ? 59
            : unit === 'hours'
            ? 23
            : 0;
      }
    }
  };

  const updateMilliseconds = () => {
    timeLeft.milliseconds -= 10;

    if (timeLeft.milliseconds < 0) {
      timeLeft.milliseconds = 990;
    }
  };

  const start = (callback?: () => void) => {
    let lastTime = Date.now();

    const frame = () => {
      const now = Date.now();
      const delta = now - lastTime;
      if (delta >= 1000) {
        lastTime = now;
        update();
      }

      updateMilliseconds();
      if (callback) callback();

      requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
  };

  const getTime = () => {
    // Вычисляем максимальную длину слова для каждой единицы времени (кроме миллисекунд)
    const maxDaysLength = getMaxWordLength(localization[locale].days);
    const maxHoursLength = getMaxWordLength(localization[locale].hours);
    const maxMinutesLength = getMaxWordLength(localization[locale].minutes);
    const maxSecondsLength = getMaxWordLength(localization[locale].seconds);

    return {
      days: leadingZeros
        ? formatNumberWithLeadingZeros(timeLeft.days, 2)
        : timeLeft.days,
      hours: leadingZeros
        ? formatNumberWithLeadingZeros(timeLeft.hours, 2)
        : timeLeft.hours,
      minutes: leadingZeros
        ? formatNumberWithLeadingZeros(timeLeft.minutes, 2)
        : timeLeft.minutes,
      seconds: leadingZeros
        ? formatNumberWithLeadingZeros(timeLeft.seconds, 2)
        : timeLeft.seconds,
      milliseconds: formatNumberWithLeadingZeros(timeLeft.milliseconds, 3), // Всегда форматируем миллисекунды с ведущими нулями

      daysWord: showWords
        ? getWordForm(timeLeft.days, localization[locale].days, maxDaysLength)
        : '',
      hoursWord: showWords
        ? getWordForm(
            timeLeft.hours,
            localization[locale].hours,
            maxHoursLength
          )
        : '',
      minutesWord: showWords
        ? getWordForm(
            timeLeft.minutes,
            localization[locale].minutes,
            maxMinutesLength
          )
        : '',
      secondsWord: showWords
        ? getWordForm(
            timeLeft.seconds,
            localization[locale].seconds,
            maxSecondsLength
          )
        : '',
      millisecondsWord: showWords
        ? getWordForm(
            timeLeft.milliseconds,
            localization[locale].milliseconds,
            0
          )
        : '',
    };
  };

  const stop = () => {
    if (interval) clearInterval(interval);
    if (millisecondInterval) clearInterval(millisecondInterval);
    interval = undefined;
    millisecondInterval = undefined;
  };

  return {
    days: timeLeft.days,
    hours: timeLeft.hours,
    minutes: timeLeft.minutes,
    seconds: timeLeft.seconds,
    milliseconds: timeLeft.milliseconds,
    toString: () => {
      const { days, hours, minutes, seconds, milliseconds } = getTime();

      let result = '';

      if (showWords) {
        const maxDayWordLength = getMaxWordLength(localization[locale].days);
        const maxHourWordLength = getMaxWordLength(localization[locale].hours);
        const maxMinuteWordLength = getMaxWordLength(
          localization[locale].minutes
        );
        const maxSecondWordLength = getMaxWordLength(
          localization[locale].seconds
        );
        const maxMillisecondWordLength = getMaxWordLength(
          localization[locale].milliseconds
        );

        result += `${days} ${getWordForm(
          timeLeft.days,
          localization[locale].days,
          maxDayWordLength
        )}${sep}`;
        result += `${hours} ${getWordForm(
          timeLeft.hours,
          localization[locale].hours,
          maxHourWordLength
        )}${sep}`;
        result += `${minutes} ${getWordForm(
          timeLeft.minutes,
          localization[locale].minutes,
          maxMinuteWordLength
        )}${sep}`;
        result += `${seconds} ${getWordForm(
          timeLeft.seconds,
          localization[locale].seconds,
          maxSecondWordLength
        )}${sep}`;
        result += `${milliseconds} ${getWordForm(
          timeLeft.milliseconds,
          localization[locale].milliseconds,
          maxMillisecondWordLength
        )}`;
      } else {
        result += `${days}:${hours}:${minutes}:${seconds}:${milliseconds}`;
      }

      return result;
    },
    start,
    stop,
    getTime,
  };
};

// vanillaWrapper.ts

interface VanillaTimerElements {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  milliseconds: string;
  wrapper: string;
}

interface VanillaTimerOptions extends TimerOptions {
  elements: VanillaTimerElements;
}

export const vanillaTimer = (options: VanillaTimerOptions) => {
  const { elements, ...timerOptions } = options;
  const timer = coreTimer(timerOptions);

  const updateDisplay = () => {
    const currentTime = timer.getTime();
    for (const key in elements) {
      if (key !== 'wrapper' && key in currentTime) {
        const elementId = elements[key as keyof VanillaTimerElements];
        const element = document.getElementById(elementId);
        if (element) {
          element.textContent = String(
            currentTime[key as keyof typeof currentTime]
          );
          // Если используются слова, дополните содержимое элемента
          if (options.showWords) {
            const wordKey = (key + 'Word') as keyof typeof currentTime;
            element.textContent += ' ' + currentTime[wordKey];
          }
        }
      }
    }
  };

  return {
    start: () => {
      timer.start(updateDisplay);
    },
    stop: timer.stop,
    updateDisplay,
  };
};

// Пример использования

const myTimerElements: VanillaTimerElements = {
  days: 'day',
  hours: 'hours',
  minutes: 'minutes',
  seconds: 'seconds',
  milliseconds: 'milliseconds',
  wrapper: 'timer',
};

const myTimer = vanillaTimer({
  elements: myTimerElements,
  days: 20,
  hours: 5,
  minutes: 34,
  seconds: 23,
  milliseconds: 9,
  locale: 'ru',
  showWords: true,
  sep: ' ',
  leadingZeros: false,
});

myTimer.start();