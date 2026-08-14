const fixedTimeValue = process.env.ALLSEARCH_E2E_FIXED_TIME;

if (fixedTimeValue) {
  const NativeDate = Date;
  const fixedTime = NativeDate.parse(fixedTimeValue);

  if (Number.isNaN(fixedTime)) {
    throw new Error(`Invalid ALLSEARCH_E2E_FIXED_TIME: ${fixedTimeValue}`);
  }

  global.Date = new Proxy(NativeDate, {
    apply(target, thisArg, argumentsList) {
      if (!argumentsList.length) return new NativeDate(fixedTime).toString();
      return Reflect.apply(target, thisArg, argumentsList);
    },
    construct(target, argumentsList, newTarget) {
      if (!argumentsList.length) return Reflect.construct(target, [fixedTime], newTarget);
      return Reflect.construct(target, argumentsList, newTarget);
    },
    get(target, property, receiver) {
      if (property === 'now') return () => fixedTime;
      return Reflect.get(target, property, receiver);
    },
  });
}
