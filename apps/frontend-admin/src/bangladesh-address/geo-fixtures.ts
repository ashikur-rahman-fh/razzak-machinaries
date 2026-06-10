export const geoDivision = { id: 6, nameEn: 'Dhaka', nameBn: 'ঢাকা' };
export const geoDistrict = { id: 61, nameEn: 'Dhaka District', nameBn: 'ঢাকা জেলা', divisionId: 6 };
export const geoUpazila = {
  id: 611,
  nameEn: 'Savar',
  nameBn: 'সাভার',
  districtId: 61,
};
export const geoUnion = {
  id: 6111,
  nameEn: 'Ashulia',
  nameBn: 'আশুলিয়া',
  upazilaId: 611,
};

export function paginated<T>(results: T[], count?: number) {
  return {
    count: count ?? results.length,
    next: null,
    previous: null,
    results,
  };
}
