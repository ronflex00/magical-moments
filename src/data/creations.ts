import type { CreationConfig } from './types';
import { validateCreation } from './validate-config';
const modules = import.meta.glob<{ default: CreationConfig }>('./creations/*.ts', { eager: true });
export const creations = Object.values(modules).map(module => module.default);
const slugs = new Set<string>();
for (const creation of creations) {
  validateCreation(creation);
  if (slugs.has(creation.slug)) throw new Error(`Slug dupliqué : ${creation.slug}`);
  slugs.add(creation.slug);
}
