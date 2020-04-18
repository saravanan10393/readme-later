import { useCallback } from "react";
export function useEnter(cb) {
  return useCallback(
    function eventHandler(evt) {
      if (evt.key === "Enter") {
        cb(evt);
      }
    },
    [cb]
  );
}
