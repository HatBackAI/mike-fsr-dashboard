/**
 * This is the only file that should need adjustment if the Lambda uses a
 * different attribute name for the FSR display name or phone number.
 */
export const API_FIELDS = {
  kitId: 'kit_id',
  routeOrder: 'route_order',
  fsrName: 'fsr_name',
  phoneNumber: 'phone_number',
  active: 'active',
  onCall: 'on_call',
  archived: 'archived',
} as const;
