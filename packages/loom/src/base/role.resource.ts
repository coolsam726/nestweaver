import {
  BooleanColumn,
  BooleanField,
  IdColumn,
  RelationColumn,
  RelationField,
  Resource,
  Schema,
  Table,
  TextColumn,
  TextField,
  TextareaField,
  InfolistBuilder,
} from '../core/index.js';

/** Roles for RBAC. Access follows permissions (`roles:viewAny`, etc.). */
export abstract class RoleResourceBase extends Resource {
  static override slug = 'roles';
  static override label = 'Roles';
  static override singularLabel = 'Role';
  static override icon = 'shield';
  static override navigationGroup = 'Administration';
  static override navigationSection = 'Users & access';
  static override recordTitleField = 'name';

  static override presentation() {
    return { form: 'modal' as const, detail: 'modal' as const };
  }

  static override form(schema: Schema) {
    schema
      .section('role', 'Role')
      .columns(2)
      .fields(
        TextField.make('name').required().searchable(),
        TextField.make('slug').required().searchable().help('Stable key, e.g. editor'),
        TextareaField.make('description'),
        RelationField.make('permissionIds')
          .manyToMany('permissions', 'name')
          .widget('checkboxList')
          .checkboxColumns(4)
          .groupBy('resource')
          .cascadeWildcards()
          .checkboxFramed(false)
          .label('Permissions')
          .columnSpanFull(),
        BooleanField.make('active').label('Active').default(true),
      );
    return schema.build();
  }

  static override table(table: Table) {
    return table
      .columns(
        IdColumn.make(),
        TextColumn.make('name').searchable().sortable(),
        TextColumn.make('slug').searchable().sortable(),
        BooleanColumn.make('active').sortable(),
      )
      .defaultSort('name', 'asc')
      .build();
  }

  static override detail(infolist: InfolistBuilder) {
    return infolist
      .section('role', 'Role')
      .entries(
        TextColumn.make('name'),
        TextColumn.make('slug'),
        TextColumn.make('description'),
        RelationColumn.make('permissionIds').manyToMany('permissions').label('Permissions'),
        BooleanColumn.make('active'),
      )
      .build();
  }
}
