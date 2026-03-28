/**
 * Bina derslik listesi: sadece fiziki derslikler döner, ek derslik üretilmez.
 */

export function padBuildingRoomList(derslikler, _gruplar, _binaLabel) {
  return [...(derslikler ?? [])];
}

/** grup adı → o binadaki (tamamlanmış) derslik listesi */
export function buildClassroomsByGroupMap(kurumData) {
  const groups = kurumData?.gruplar ?? [];
  const binalar = kurumData?.binalar;
  const map = {};

  if (Array.isArray(binalar) && binalar.length > 0) {
    for (const bina of binalar) {
      const gruplar = bina.gruplar ?? [];
      const label = bina.ad || bina.id || "Bina";
      const rooms = padBuildingRoomList(bina.derslikler, gruplar, label);
      for (const g of gruplar) {
        map[g] = rooms;
      }
    }
    for (const g of groups) {
      if (!map[g]?.length) {
        const n = Number(kurumData?.derslik_sayisi) || 6;
        map[g] = Array.from({ length: n }, (_, i) => `Derslik ${i + 1}`);
      }
    }
    return map;
  }

  const n = Number(kurumData?.derslik_sayisi) || 6;
  const pool = Array.from({ length: n }, (_, i) => `Derslik ${i + 1}`);
  for (const g of groups) map[g] = [...pool];
  return map;
}

/** Tüm derslik adları (dropdown için, sıra korunur) */
export function getAllCampusClassroomNames(kurumData) {
  const map = buildClassroomsByGroupMap(kurumData);
  const seen = new Set();
  const list = [];
  for (const rooms of Object.values(map)) {
    for (const r of rooms ?? []) {
      if (r && !seen.has(r)) {
        seen.add(r);
        list.push(r);
      }
    }
  }
  return list;
}
