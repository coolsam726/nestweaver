import {
  BooleanColumn,
  BooleanField,
  DateTimeColumn,
  IdColumn,
  RelationColumn,
  RelationField,
  Resource,
  Schema,
  SelectField,
  Table,
  TextColumn,
  TextField,
  InfolistBuilder,
} from '@nodeweaver/loom';

export abstract class LocationResourceBase extends Resource {
  static override slug = 'stock-locations';
  static override label = 'Locations';
  static override singularLabel = 'Location';
  static override icon = 'map-pin';
  static override navigationGroup = 'Inventory';
  static override navigationSection = 'Operations';
  static override navigationSort = 11;
  static override recordTitleField = 'name';
  static override companyScoped = true;

  static override form(schema: Schema) {
    schema
      .section('identity', 'Identity')
      .columns(2)
      .fields(
        TextField.make('name').required().searchable(),
        TextField.make('completeName').label('Complete name').searchable(),
        SelectField.make('usage')
          .label('Location type')
          .options([
            { label: 'Internal', value: 'internal' },
            { label: 'Supplier', value: 'supplier' },
            { label: 'Customer', value: 'customer' },
            { label: 'Inventory loss', value: 'inventory' },
            { label: 'Production', value: 'production' },
            { label: 'Transit', value: 'transit' },
          ]),
        RelationField.make('warehouseId').manyToOne('warehouses', 'name').label('Warehouse'),
        RelationField.make('parentId').manyToOne('stock-locations', 'name').label('Parent'),
        BooleanField.make('active').label('Active').inline(),
      );
    return schema.build();
  }

  static override table(table: Table) {
    return table
      .columns(
        IdColumn.make(),
        TextColumn.make('name').searchable().sortable(),
        TextColumn.make('usage').sortable(),
        RelationColumn.make('warehouseId').manyToOne('warehouses', 'name').label('Warehouse'),
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
        TextColumn.make('completeName').label('Complete name'),
        TextColumn.make('usage'),
        RelationColumn.make('warehouseId').manyToOne('warehouses', 'name').label('Warehouse'),
        BooleanColumn.make('active'),
        DateTimeColumn.make('createdAt'),
      )
      .build();
  }
}
