const fields = foundry.data.fields;

export const accordionSpeedField = (required = true) =>
  new fields.NumberField({
    required,
    nullable: false,
    integer: true,
    positive: true,
    min: 100,
    step: 50,
    max: 5000,
    initial: required ? 350 : undefined,
  });
