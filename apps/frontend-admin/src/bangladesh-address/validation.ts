export type GeoFormValues = {
  nameEn: string;
  nameBn: string;
  parentId?: number;
};

export type GeoNameFormValues = Pick<GeoFormValues, 'nameEn' | 'nameBn'>;

export type GeoNameUpdatePayload = Partial<GeoNameFormValues>;

export type GeoFormErrors = Partial<Record<'nameEn' | 'nameBn' | 'parentId' | 'form', string>>;

export function validateGeoForm(
  values: GeoFormValues,
  options?: { requireParent?: boolean },
): GeoFormErrors {
  const errors: GeoFormErrors = {};
  const nameEn = values.nameEn.trim();
  const nameBn = values.nameBn.trim();

  if (!nameEn) {
    errors.nameEn = 'required';
  }
  if (!nameBn) {
    errors.nameBn = 'required';
  }
  if (options?.requireParent && (!values.parentId || values.parentId <= 0)) {
    errors.parentId = 'required';
  }

  return errors;
}

export function trimGeoFormValues(values: GeoFormValues): GeoFormValues {
  return {
    nameEn: values.nameEn.trim(),
    nameBn: values.nameBn.trim(),
    parentId: values.parentId,
  };
}

export type FieldChange = {
  labelKey: string;
  from: string;
  to: string;
};

export function getFieldChanges(
  original: GeoFormValues,
  updated: GeoFormValues,
  labelKeys: { nameEn: string; nameBn: string; parent?: string },
): FieldChange[] {
  const changes: FieldChange[] = [];
  const trimmed = trimGeoFormValues(updated);
  const origTrimmed = trimGeoFormValues(original);

  if (origTrimmed.nameEn !== trimmed.nameEn) {
    changes.push({ labelKey: labelKeys.nameEn, from: origTrimmed.nameEn, to: trimmed.nameEn });
  }
  if (origTrimmed.nameBn !== trimmed.nameBn) {
    changes.push({ labelKey: labelKeys.nameBn, from: origTrimmed.nameBn, to: trimmed.nameBn });
  }
  if (
    labelKeys.parent &&
    origTrimmed.parentId !== undefined &&
    trimmed.parentId !== undefined &&
    origTrimmed.parentId !== trimmed.parentId
  ) {
    changes.push({
      labelKey: labelKeys.parent,
      from: String(origTrimmed.parentId),
      to: String(trimmed.parentId),
    });
  }

  return changes;
}

export function hasGeoNameChanges(
  original: GeoNameFormValues,
  current: GeoNameFormValues,
): boolean {
  const origTrimmed = trimGeoFormValues({ ...original, parentId: undefined });
  const currTrimmed = trimGeoFormValues({ ...current, parentId: undefined });
  return origTrimmed.nameEn !== currTrimmed.nameEn || origTrimmed.nameBn !== currTrimmed.nameBn;
}

export function buildGeoNameUpdatePayload(
  original: GeoNameFormValues,
  updated: GeoNameFormValues,
): GeoNameUpdatePayload {
  const origTrimmed = trimGeoFormValues({ ...original, parentId: undefined });
  const trimmed = trimGeoFormValues({ ...updated, parentId: undefined });
  const payload: GeoNameUpdatePayload = {};

  if (origTrimmed.nameEn !== trimmed.nameEn) {
    payload.nameEn = trimmed.nameEn;
  }
  if (origTrimmed.nameBn !== trimmed.nameBn) {
    payload.nameBn = trimmed.nameBn;
  }

  return payload;
}
