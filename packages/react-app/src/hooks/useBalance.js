import { BigNumber } from "ethers";
import { useState, useCallback, useRef, useEffect } from "react";
const zero = BigNumber.from(0);

export const useBalance = (provider, address, pollTime = 0) => {
  const [balance, setBalance] = useState();
  const pollBalance = useCallback(
    async (provider, address) => {
      if (provider && address) {
        const newBalance = await provider.getBalance(address);
        if (!newBalance.eq(balance !== null && balance !== void 0 ? balance : zero)) {
          setBalance(newBalance);
          console.log(address, newBalance.toString(), balance);
        }
      }
    },
    [balance],
  );
  useOnRepetition(
    pollBalance,
    { pollTime, provider, leadingTrigger: address != null && address !== "" && provider != null },
    provider,
    address,
  );
  return balance !== null && balance !== void 0 ? balance : zero;
};

const DEBUG = false;

export const useOnRepetition = (callback, options, ...args) => {
  const polling = (options === null || options === void 0 ? void 0 : options.pollTime) && options.pollTime > 0;
  const leadingCall = useRef(true);
  // created a strigified args to use for deps
  const argDeps = JSON.stringify(args !== null && args !== void 0 ? args : []);

  // save the input function provided
  const callFunctionWithArgs = useCallback(() => {
    console.log(`Callback function changed`);
    if (callback) {
      if (args && args.length > 0) {
        void callback(...args);
      } else {
        void callback();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callback, argDeps, args]);
  // Turn on the listener if we have a function & a provider
  const listener = useCallback(
    _blockNumber => {
      if (options.provider) callFunctionWithArgs();
    },
    [callFunctionWithArgs, options.provider],
  );
  // connect a listener for block changes
  useEffect(() => {
    if (options.provider && !polling) {
      if (DEBUG) console.log("register block event", ...args);
      options.provider.addListener("block", listener);
      return () => {
        var _a;
        if (DEBUG) console.log("unregister block event", ...args);
        (_a = options === null || options === void 0 ? void 0 : options.provider) === null || _a === void 0
          ? void 0
          : _a.removeListener("block", listener);
      };
    } else {
      return () => {
        // do nothing
      };
    }
  }, [options.provider, polling, listener, args]);
  // Set up the interval if its using polling
  useEffect(() => {
    const tick = () => {
      if (DEBUG) console.log("polling: call function");
      callFunctionWithArgs();
    };
    if (polling && (options === null || options === void 0 ? void 0 : options.pollTime)) {
      const safePollTime =
        (options === null || options === void 0 ? void 0 : options.pollTime) > 10000 ? options.pollTime : 10000;
      const id = setInterval(tick, safePollTime);
      return () => {
        clearInterval(id);
      };
    }
  }, [options.pollTime, polling, callFunctionWithArgs]);
  // call if triggered by extra watch, however only on inital call
  useEffect(() => {
    console.log(`leadingCall trigger !!!!`);
    if (
      options.leadingTrigger &&
      callFunctionWithArgs != null &&
      (leadingCall === null || leadingCall === void 0 ? void 0 : leadingCall.current) === true
    ) {
      console.log(`leadingCall call !!!!`);
      leadingCall.current = false;
      callFunctionWithArgs();
    }
  }, [options.leadingTrigger, callFunctionWithArgs]);

  useEffect(() => {
    console.log(`newUseEffect trigger !!!!`);
    if (options.leadingTrigger && callFunctionWithArgs != null) {
      console.log(`newUseEffect call !!!!`, argDeps);
      callFunctionWithArgs();
    }
  }, [argDeps, options.leadingTrigger]);
};
