import type { Char } from '@prisma/orm-postgres/target/codec-types';

export type DbId = Char<36>;

export const dbId = (value: string): DbId => value as DbId;
