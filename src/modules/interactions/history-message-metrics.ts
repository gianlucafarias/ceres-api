import { SelectQueryBuilder } from 'typeorm';
import { History } from '../../entities/history.entity';

export function buildReceivedMessageCondition(alias = 'history'): string {
  return `(
    ${alias}.keyword IS NOT NULL
    AND btrim(${alias}.keyword) <> ''
    AND ${alias}.keyword !~ '^(key_|ans_)'
  )`;
}

export function buildValidMessageWhereClauses(alias = 'history'): string[] {
  return [
    `${alias}.answer IS NOT NULL`,
    `btrim(${alias}.answer) <> ''`,
    `${alias}.answer !~ '^__'`,
    `${alias}.answer !~ '^_event_'`,
    `${alias}.answer !~* 'end_?flow'`,
  ];
}

export function applyValidMessageFilters(
  qb: SelectQueryBuilder<History>,
  alias = 'history',
): void {
  for (const clause of buildValidMessageWhereClauses(alias)) {
    qb.andWhere(clause);
  }
}

export function toSafeCount(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return parsed;
}
