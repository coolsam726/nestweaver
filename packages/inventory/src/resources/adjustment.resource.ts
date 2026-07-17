import {
  DateTimeColumn,
  IdColumn,
  NumberField,
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

export abstract class AdjustmentResourceBase extends Resource {
  static override slug = 'stock-adjustments';
  static override label = 'Inventory adjustments';
  static override singularLabel = 'Adjustment';
  static override icon = 'clipboard';
  static override navigationGroup = 'Inventory';
  static override navigationSection = 'Operations';
  static override navigationSort = 15;
  static override recordTitleField = 'name';
  static override companyScoped = true;

  static override permissions() {
    return [{ name: 'validate', label: 'Validate adjustments' }];
  }

  static override form(schema: Schema) {
    schema
      .section('identity', 'Adjustment')
      .columns(2)
      .fields(
        TextField.make('name').searchable(),
        RelationField.make('locationId')
          .manyToOne('stock-locations', 'name')
          .label('Location')
          .required(),
        RelationField.make('productId').manyToOne('products', 'name').label('Product').required(),
        NumberField.make('theoreticalQty').label('Theoretical'),
        NumberField.make('countedQty').label('Counted').required(),
        SelectField.make('state')
          .label('Status')
          .options([
            { label: 'Draft', value: 'draft' },
            { label: 'Done', value: 'done' },
            { label: 'Cancelled', value: 'cancel' },
          ]),
      );
    return schema.build();
  }

  static override table(table: Table) {
    return table
      .columns(
        IdColumn.make(),
        TextColumn.make('name').searchable().sortable(),
        RelationColumn.make('productId').manyToOne('products', 'name').label('Product'),
        RelationColumn.make('locationId').manyToOne('stock-locations', 'name').label('Location'),
        TextColumn.make('countedQty').label('Counted').sortable(),
        TextColumn.make('state').sortable(),
        DateTimeColumn.make('createdAt').sortable(),
      )
      .defaultSort('createdAt', 'desc')
      .build();
  }

  static override detail(infolist: InfolistBuilder) {
    return infolist
      .section('identity', 'Adjustment')
      .entries(
        TextColumn.make('name'),
        RelationColumn.make('productId').manyToOne('products', 'name').label('Product'),
        RelationColumn.make('locationId').manyToOne('stock-locations', 'name').label('Location'),
        TextColumn.make('theoreticalQty').label('Theoretical'),
        TextColumn.make('countedQty').label('Counted'),
        TextColumn.make('state'),
        DateTimeColumn.make('createdAt'),
      )
      .build();
  }
}
