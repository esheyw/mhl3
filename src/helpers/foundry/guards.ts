export function isModule(value: unknown): value is Module {
  return value instanceof foundry.packages.BaseModule;
}
