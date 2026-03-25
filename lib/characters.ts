// lib/characters.ts
// Shared helpers for character row serialisation / deserialisation.
// Kept in lib/ so API route files only export HTTP handlers.

export function deserialise(row: any) {
  return {
    id:              row.id,
    name:            row.name,
    player:          row.player,
    species:         row.species,
    career:          row.career,
    specialisation:  row.specialisation,
    colorIdx:        row.color_idx,
    characteristics: JSON.parse(row.characteristics || '{}'),
    wounds:          row.wounds,
    woundThreshold:  row.wound_threshold,
    strain:          row.strain,
    strainThreshold: row.strain_threshold,
    soak:            row.soak,
    defense:         row.defense,
    forceRating:     row.force_rating,
    duty:            row.duty,
    dutyType:        row.duty_type,
    morality:        row.morality,
    skills:          JSON.parse(row.skills    || '{}'),
    talents:         JSON.parse(row.talents   || '[]'),
    weapons:         JSON.parse(row.weapons   || '[]'),
    equipment:       JSON.parse(row.equipment || '[]'),
    notes:           row.notes,
    xp:              row.xp,
    totalXp:         row.total_xp,
    ownerId:         row.owner_id || '',
  }
}

export function serialiseParams(b: any): any[] {
  return [
    b.id,
    b.name            || 'New Character',
    b.player          || '',
    b.species         || '',
    b.career          || '',
    b.specialisation  || '',
    b.colorIdx        ?? 0,
    JSON.stringify(b.characteristics ?? {}),
    b.wounds          ?? 0,
    b.woundThreshold  ?? 12,
    b.strain          ?? 0,
    b.strainThreshold ?? 12,
    b.soak            ?? 2,
    b.defense         ?? 0,
    b.forceRating     ?? 0,
    b.duty            ?? 0,
    b.dutyType        ?? '',
    b.morality        ?? 50,
    JSON.stringify(b.skills    ?? {}),
    JSON.stringify(b.talents   ?? []),
    JSON.stringify(b.weapons   ?? []),
    JSON.stringify(b.equipment ?? []),
    b.notes           ?? '',
    b.xp              ?? 0,
    b.totalXp         ?? 0,
  ]
}
