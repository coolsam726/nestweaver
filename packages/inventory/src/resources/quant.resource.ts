import {
  DateTimeColumn,
  IdColumn,
  NumberField,
  RelationColumn,
  RelationField,
  Resource,
  Schema,
  Table,
  TextColumn,
  InfolistBuilder,
} from '@nodeweaver/loom';

export abstract class QuantResourceBase extends Resource {
  static override slug = 'stock-quants';
  static override label = 'On-hand stock';
  static override singularLabel = 'Quant';
  static override icon = 'layers';
  static override navigationGroup = 'Inventory';
  static override navigationSection = 'Reporting';
  static override navigationSort = 40;
  static override recordTitleField = 'productId';
  static override companyScoped = true;

  static override form(schema: Schema) {
    schema
      .section('identity', 'Quant')
      .columns(2)
      .fields(
        RelationField.make('productId').manyToOne('products', 'name').label('Product').required(),
        RelationField.make('locationId')
          .manyToOne('stock-locations', 'name')
          .label('Location')
          .required(),
        RelationField.make('lotId').manyToOne('stock-lots', 'name').label('Lot/Serial'),
        NumberField.make('quantity').required().label('On hand'),
        NumberField.make('reservedQuantity').label('Reserved'),
      );
    return schema.build();
  }

  static override table(table: Table) {
    return table
      .columns(
        IdColumn.make(),
        RelationColumn.make('productId').manyToOne('products', 'name').label('Product'),
        RelationColumn.make('locationId').manyToOne('stock-locations', 'name').label('Location'),
        RelationColumn.make('lotId').manyToOne('stock-lots', 'name').label('Lot'),
        TextColumn.make('quantity').sortable(),
        TextColumn.make('reservedQuantity').label('Reserved').sortable(),
        DateTimeColumn.make('updatedAt').sortable(),
      )
      .defaultSort('updatedAt', 'desc')
      .build();
  }

  static override detail(infolist: InfolistBuilder) {
    return infolist
      .section('identity', 'Quant')
      .entries(
        RelationColumn.make('productId').manyToOne('products', 'name').label('Product'),
        RelationColumn.make('locationId').manyToOne('stock-locations', 'name').label('Location'),
        RelationColumn.make('lotId').manyToOne('stock-lots', 'name').label('Lot'),
        TextColumn.make('quantity'),
        TextColumn.make('reservedQuantity').label('Reserved'),
        DateTimeColumn.make('updatedAt'),
      )
      .build();
  }
}
