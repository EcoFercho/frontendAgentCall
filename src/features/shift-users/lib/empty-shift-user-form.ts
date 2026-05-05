export function createEmptyShiftUserForm(shiftDate = "") {
  return {
    id: "",
    firstName: "",
    lastName: "",
    phone: "",
    shiftDate,
    shiftStart: "08:00",
    shiftEnd: "17:00",
    isMaster: false
  };
}

export const emptyShiftUserForm = createEmptyShiftUserForm();
