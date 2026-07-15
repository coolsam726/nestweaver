import {
  BooleanColumn,
  BooleanField,
  DateTimeColumn,
  IdColumn,
  Resource,
  Schema,
  Table,
  TextColumn,
  TextField,
  InfolistBuilder,
} from '@nodeweaver/loom';

export abstract class WarehouseResourceBase extends Resource {
  static override slug = 'warehouses';
  static override label = 'Warehouses';
  static override singularLabel = 'Warehouse';
  static override icon = 'building';
  static override navigationGroup = 'Inventory';
  static override navigationSection = 'Operations';
  static override navigationSort = 10;
  static override recordTitleField = 'name';
  static override companyScoped = true;

  static override form(schema: Schema) {
    schema
      .section('identity', 'Identity')
      .columns(2)
      .fields(
        TextField.make('name').required().searchable(),
        TextField.make('code').searchable().placeholder('WH'),
        BooleanField.make('active').label('Active').inline(),
      );
    return schema.build();
  }

  static override table(table: Table) {
    return table
      .columns(
        IdColumn.make(),
        TextColumn.make('name').searchable().sortable(),
        TextColumn.make('code').searchable().sortable(),
        BooleanColumn.make('active').sortable(),
        DateTimeColumn.make('createdAt').sortable(),
      )
      .defaultSort('name', 'asc')
      .build();
  }

  static override detail(infolist: InfolistBuilder) {
    return infolist
      .section('identity', 'Identity')
      .entries(
        TextColumn.make('name'),
        TextColumn.make('code'),
        BooleanColumn.make('active'),
        DateTimeColumn.make('createdAt'),
      )
      .build();
  }
}
