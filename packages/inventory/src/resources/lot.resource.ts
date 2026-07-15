import {
  DateTimeColumn,
  IdColumn,
  RelationColumn,
  RelationField,
  Resource,
  Schema,
  Table,
  TextColumn,
  TextField,
  InfolistBuilder,
} from '@nodeweaver/loom';

export abstract class LotResourceBase extends Resource {
  static override slug = 'stock-lots';
  static override label = 'Lots / Serials';
  static override singularLabel = 'Lot';
  static override icon = 'tag';
  static override navigationGroup = 'Inventory';
  static override navigationSection = 'Master data';
  static override navigationSort = 20;
  static override recordTitleField = 'name';
  static override companyScoped = true;

  static override form(schema: Schema) {
    schema
      .section('identity', 'Identity')
      .columns(2)
      .fields(
        TextField.make('name').required().searchable(),
        RelationField.make('productId').manyToOne('products', 'name').label('Product').required(),
      );
    return schema.build();
  }

  static override table(table: Table) {
    return table
      .columns(
        IdColumn.make(),
        TextColumn.make('name').searchable().sortable(),
        RelationColumn.make('productId').manyToOne('products', 'name').label('Product'),
        DateTimeColumn.make('createdAt').sortable(),
      )
      .defaultSort('createdAt', 'desc')
      .build();
  }

  static override detail(infolist: InfolistBuilder) {
    return infolist
      .section('identity', 'Identity')
      .entries(
        TextColumn.make('name'),
        RelationColumn.make('productId').manyToOne('products', 'name').label('Product'),
        DateTimeColumn.make('createdAt'),
      )
      .build();
  }
}
