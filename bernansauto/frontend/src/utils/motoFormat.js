/**
 * Объём двигателя мотоцикла в куб. см.
 * Значения меньше 30 трактуем как литры (старые записи) и переводим в куб. см.
 */
export function motoEngineVolumeCc(value) {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n < 30 ? Math.round(n * 1000) : Math.round(n);
}

export function formatMotoEngineVolume(value) {
  const cc = motoEngineVolumeCc(value);
  if (cc === null) return '';
  return `${cc.toLocaleString('ru-RU')} куб. см.`;
}
