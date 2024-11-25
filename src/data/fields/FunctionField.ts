import type { DataField } from "fvtt-types/src/foundry/common/data/fields.d.mts";
import type {
  AnyFunction,
  SimpleMerge,
} from "fvtt-types/src/types/utils.d.mts";

/* eslint-disable @typescript-eslint/no-namespace */
export class FunctionField<
  Options extends FunctionField.Options = FunctionField.DefaultOptions,
  AssignmentType = FunctionField.AssignmentType<
    SimpleMerge<Options, FunctionField.DefaultOptions>
  >,
  InitializedType = FunctionField.InitializedType<
    SimpleMerge<Options, FunctionField.DefaultOptions>
  >,
  PersistedType extends
    | AnyFunction
    | null
    | undefined = FunctionField.InitializedType<
    SimpleMerge<Options, FunctionField.DefaultOptions>
  >,
> extends foundry.data.fields.DataField<
  Options,
  AssignmentType,
  InitializedType,
  PersistedType
> {
  protected override _validateType(
    value: InitializedType,
    _options?: DataField.ValidationOptions<DataField.Any>,
  ): boolean {
    return typeof value === "function";
  }

  protected override _cast(value: AssignmentType): InitializedType {
    return value;
  }

  override getInitialValue(_data?: unknown): AnyFunction | undefined | null {
    return this.initial;
  }
}

namespace FunctionField {
  export type Options = DataFieldOptions<AnyFunction>;

  export type DefaultOptions = Options;

  export type MergedOptions<Opts extends Options> = SimpleMerge<
    DefaultOptions,
    Opts
  >;
  export type AssignmentType<Opts extends Options> =
    DataField.DerivedAssignmentType<AnyFunction, MergedOptions<Opts>>;
  export type InitializedType<Opts extends Options> =
    DataField.DerivedInitializedType<AnyFunction, MergedOptions<Opts>>;
}
