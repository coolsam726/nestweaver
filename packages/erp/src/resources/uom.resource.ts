import {
  BooleanColumn,
  BooleanField,
  DateTimeColumn,
  IdColumn,
  NumberField,
  RelationColumn,
  RelationField,
  Resource,
  Schema,
  Table,
  TextColumn,
  TextField,
  InfolistBuilder,
} from '@nodeweaver/loom';

export abstract class UomResourceBase extends Resource {
  static override slug = 'uoms';
  static override label = 'Units of measure';
  static override singularLabel = 'Unit of measure';
  static override icon = 'ruler';
  static override navigationGroup = 'Master data';
  static override navigationSection = 'Units';
  static override navigationSort = 31;
  static override recordTitleField = 'name';
  static override companyScoped = true;

  static override form(schema: Schema) {
    schema
      .section('identity', 'Identity')
      .columns(2)
      .fields(
        TextField.make('name').required().searchable(),
        RelationField.make('categoryId')
          .manyToOne('uom-categories', 'name')
          .label('Category')
          .required(),
        NumberField.make('factor').label('Ratio to reference').placeholder('1'),
        NumberField.make('rounding').label('Rounding precision'),
        BooleanField.make('active').label('Active').inline(),
      );
    return schema.build();
  }

  static override table(table: Table) {
    return table
      .columns(
        IdColumn.make(),
        TextColumn.make('name').searchable().sortable(),
        RelationColumn.make('categoryId')
          .manyToOne('uom-categories', 'name')
          .label('Category'),
        TextColumn.make('factor').sortable(),
        BooleanColumn.make('active').sortable(),
      )
      .defaultSort('name', 'asc')
      .build();
  }

  static override detail(infolist: InfolistBuilder) {
    return infolist
      .section('identity', 'Identity')
      .entries(
        TextColumn.make('name'),
        RelationColumn.make('categoryId')
          .manyToOne('uom-categories', 'name')
          .label('Category'),
        TextColumn.make('factor'),
        TextColumn.make('rounding'),
        BooleanColumn.make('active'),
        DateTimeColumn.make('createdAt'),
      )
      .build();
  }
}
