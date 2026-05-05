import { notificationStateActions } from "./notificationsComponent";
import type { NotificationState } from "../types/notifications";

function assertStatesEqual(
  actual: NotificationState[],
  expected: NotificationState[],
) {
  if (actual.join(",") !== expected.join(",")) {
    throw new Error(`Expected ${expected.join(",")} but received ${actual}`);
  }
}

assertStatesEqual(
  notificationStateActions("inbox").map((action) => action.state),
  ["read"],
);

assertStatesEqual(
  notificationStateActions("read").map((action) => action.state),
  ["inbox"],
);
