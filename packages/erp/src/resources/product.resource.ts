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
  SelectField,
  Table,
  TextColumn,
  TextField,
  InfolistBuilder,
} from '@nodeweaver/loom';

export abstract class ProductResourceBase extends Resource {
  static override slug = 'products';
  static override label = 'Products';
  static override singularLabel = 'Product';
  static override icon = 'box';
  static override navigationGroup = 'Master data';
  static override navigationSection = 'Commercial';
  static override navigationSort = 20;
  static override recordTitleField = 'name';
  static override companyScoped = true;

  static override form(schema: Schema) {
    schema
      .section('identity', 'Identity')
      .columns(2)
      .fields(
        TextField.make('name').required().searchable(),
        TextField.make('sku').label('SKU').searchable(),
        TextField.make('barcode').searchable(),
        SelectField.make('productType')
          .label('Type')
          .options([
            { label: 'Goods', value: 'goods' },
            { label: 'Service', value: 'service' },
          ]),
        RelationField.make('uomId').manyToOne('uoms', 'name').label('Unit of measure'),
        SelectField.make('tracking')
          .label('Tracking')
          .options([
            { label: 'No tracking', value: 'none' },
            { label: 'By lots', value: 'lot' },
            { label: 'By unique serial', value: 'serial' },
          ]),
        SelectField.make('costMethod')
          .label('Cost method')
          .options([
            { label: 'Standard price', value: 'standard' },
            { label: 'Average cost', value: 'average' },
            { label: 'FIFO', value: 'fifo' },
          ]),
        NumberField.make('listPrice').label('Sales price'),
        NumberField.make('standardCost').label('Cost'),
        BooleanField.make('active').label('Active').inline(),
      )
      .section('accounts', 'Accounts', 'Optional links used when Accounting is installed')
      .columns(2)
      .fields(
        RelationField.make('incomeAccountId')
          .manyToOne('accounts', 'name')
          .label('Income account'),
        RelationField.make('expenseAccountId')
          .manyToOne('accounts', 'name')
          .label('Expense account'),
        RelationField.make('stockAccountId')
          .manyToOne('accounts', 'name')
          .label('Stock valuation'),
        RelationField.make('stockInputAccountId')
          .manyToOne('accounts', 'name')
          .label('Stock input (interim)'),
        RelationField.make('stockOutputAccountId')
          .manyToOne('accounts', 'name')
          .label('Stock output / COGS'),
      );
    return schema.build();
  }

  static override table(table: Table) {
    return table
      .columns(
        IdColumn.make(),
        TextColumn.make('name').searchable().sortable(),
        TextColumn.make('sku').label('SKU').searchable().sortable(),
        TextColumn.make('productType').label('Type').sortable(),
        RelationColumn.make('uomId').manyToOne('uoms', 'name').label('UoM'),
        TextColumn.make('tracking').sortable(),
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
        TextColumn.make('sku').label('SKU'),
        TextColumn.make('barcode'),
        TextColumn.make('productType').label('Type'),
        RelationColumn.make('uomId').manyToOne('uoms', 'name').label('UoM'),
        TextColumn.make('tracking'),
        TextColumn.make('costMethod').label('Cost method'),
        TextColumn.make('listPrice').label('Sales price'),
        TextColumn.make('standardCost').label('Cost'),
        BooleanColumn.make('active'),
        DateTimeColumn.make('createdAt'),
      )
      .build();
  }
}
