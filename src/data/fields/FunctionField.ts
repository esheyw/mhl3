import type { DataField } from "fvtt-types/src/foundry/common/data/fields.d.mts";
import type {
  AnyFunction,
  SimpleMerge,
} from "fvtt-types/src/types/utils.d.mts";

/* eslint-disable @typescript-eslint/no-namespace */
export class FunctionField<
  Options extends FunctionField.Options = FunctionField.DefaultOptions,
  FunctionType = FunctionField.AssignmentType<
    SimpleMerge<Options, FunctionField.DefaultOptions>
  >,
> extends foundry.data.fields.DataField<Options, FunctionType> {
  protected override _validateType(
    value: unknown,
    _options?: DataField.ValidationOptions<DataField.Any>,
  ): boolean {
    return typeof value === "function";
  }

  protected override _cast(value: FunctionType): FunctionType {
    return value;
  }

  override getInitialValue(): FunctionType {
    return this.initial as FunctionType;
  }
}

namespace FunctionField {
  export type Options = DataFieldOptions<AnyFunction>;

  export type DefaultOptions = Options;

  type MergedOptions<Opts extends Options> = SimpleMerge<DefaultOptions, Opts>;
  export type AssignmentType<Opts extends Options> =
    DataField.DerivedAssignmentType<AnyFunction, MergedOptions<Opts>>;
}
