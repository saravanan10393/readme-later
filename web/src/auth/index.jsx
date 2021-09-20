import React, { useEffect } from "react";
import { Button, Intent, Tooltip } from "@blueprintjs/core";
import {
  Delta as DeltaIcon,
  Endorsed as EndrosedIcon,
} from "@blueprintjs/icons";

import { useAuthStore, AuthAPI } from "./auth.store";

export function SyncLabel() {
  let isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  useEffect(function showSyncMessage() {
    AuthAPI.getState().checkLoggedIn();
  }, []);

  return (
    <div>
      {!isAuthenticated ? (
        <Tooltip content="Enable sync to access your links in all devices.">
          <Button
            onClick={AuthAPI.getState().login}
            intent={Intent.WARNING}
            minimal
            icon={<DeltaIcon />}
          >
            Enable Sync
          </Button>
        </Tooltip>
      ) : (
        <Tooltip content="All changes were synced to server">
          <Button intent={Intent.SUCCESS} minimal icon={<EndrosedIcon />}>
            Sync Enabled
          </Button>
        </Tooltip>
      )}
    </div>
  );
}
