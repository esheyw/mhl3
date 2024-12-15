import type { AnyObject, SimpleMerge } from "fvtt-types/src/types/utils.d.mts";
import type {
  DataField,
  StringField,
} from "fvtt-types/src/foundry/common/data/fields.d.mts";
import type DataModel from "fvtt-types/src/foundry/common/abstract/data.d.mts";
import { isModule } from "../../helpers/foundry/guards.ts";

/* eslint-disable @typescript-eslint/no-namespace */

export class ModuleField<
  Options extends StringFieldOptions = ModuleField.DefaultOptions,
  AssignmentType extends
    ModuleField.AssignmentType<Options> = ModuleField.AssignmentType<Options>,
  InitializedType extends
    ModuleField.InitializedType<Options> = ModuleField.InitializedType<Options>,
  PersistedType extends
    | string
    | null
    | undefined = ModuleField.PersistedType<Options>,
> extends foundry.data.fields.StringField<
  Options,
  AssignmentType,
  InitializedType,
  PersistedType
> {
  /** Whether this feild returns a module ID only (true) or a Module instance (false) */
  idOnly?: boolean;

  constructor(options?: Options, context?: DataField.Context) {
    super(options, context);

    // required to support returning a getter function from `initialize()`
    // see `DataModel#_initialize()`
    this.readonly = false;
  }
  static override get _defaults() {
    return Object.assign(super._defaults, {
      blank: false,
      idOnly: false,
      initial: null,
      nullable: true,
      required: true,
      readonly: false,
    });
  }

  override initialize(
    value: PersistedType,
    _model: DataModel.Any,
    _options?: AnyObject,
  ): InitializedType | (() => InitializedType | null) {
    if (this.idOnly || value === null || value === undefined) return value;
    if (value) return () => game.modules.get(value) ?? null;
  }

  protected override _cast(value: AssignmentType): InitializedType {
    if (typeof value === "string") return value;
    if (isModule(value)) return value.id;
    throw new Error(
      "The value provided to a ModuleField must be a Module instance or ID.",
    );
  }

  override toObject(value: InitializedType): PersistedType {
    if (typeof value === "string") return value;
    if (value instanceof foundry.packages.BaseModule) return value.id;
    throw new Error("The persisted value for this field was somehow invalid.");
  }

  //TODO: implement as a <select> for modules?
  // protected override _toInput(config: unknown): HTMLElement | HTMLCollection {

  // }
}

namespace ModuleField {
  export type Options = StringFieldOptions &
    DataFieldOptions<string | Module> & { idOnly?: boolean };

  export type DefaultOptions = SimpleMerge<
    StringField.DefaultOptions,
    {
      blank: false;
      idOnly: false;
      nullable: true;
      required: true;
      readonly: true;
    }
  >;

  /**
   * A helper type for the given options type merged into the default options of the ForeignDocumentField class.
   * @typeParam Opts - the options that override the default options
   */
  type MergedOptions<Opts extends Options> = SimpleMerge<DefaultOptions, Opts>;

  /**
   * A shorthand for the assignment type of a ForeignDocumentField class.
   * @typeParam Opts - the options that override the default options
   */
  export type AssignmentType<Opts extends Options> =
    DataField.DerivedAssignmentType<string | Module, MergedOptions<Opts>>;

  /**
   * A shorthand for the initialized type of a ForeignDocumentField class.
   * @typeParam Opts - the options that override the default options
   */
  export type InitializedType<Opts extends Options> =
    DataField.DerivedInitializedType<
      Opts["idOnly"] extends true ? string : Module,
      MergedOptions<Opts>
    >;
  /**
   * A shorthand for the persisted type of a ForeignDocumentField class.
   * @typeParam Opts - the options that override the default options
   */
  export type PersistedType<Opts extends Options> =
    DataField.DerivedInitializedType<string, MergedOptions<Opts>>;
}
