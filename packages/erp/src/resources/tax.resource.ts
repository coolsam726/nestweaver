import {
  BooleanColumn,
  BooleanField,
  DateTimeColumn,
  IdColumn,
  NumberField,
  Resource,
  Schema,
  SelectField,
  Table,
  TextColumn,
  TextField,
  InfolistBuilder,
} from '@nodeweaver/loom';

export abstract class TaxResourceBase extends Resource {
  static override slug = 'taxes';
  static override label = 'Taxes';
  static override singularLabel = 'Tax';
  static override icon = 'percent';
  static override navigationGroup = 'Master data';
  static override navigationSection = 'Fiscal';
  static override navigationSort = 40;
  static override recordTitleField = 'name';
  static override companyScoped = true;

  static override form(schema: Schema) {
    schema
      .section('identity', 'Identity')
      .columns(2)
      .fields(
        TextField.make('name').required().searchable(),
        NumberField.make('amount').required().label('Amount'),
        SelectField.make('amountType')
          .label('Computation')
          .options([
            { label: 'Percentage', value: 'percent' },
            { label: 'Fixed', value: 'fixed' },
          ]),
        SelectField.make('scope')
          .label('Scope')
          .options([
            { label: 'Sales', value: 'sale' },
            { label: 'Purchases', value: 'purchase' },
            { label: 'None', value: 'none' },
          ]),
        BooleanField.make('active').label('Active').inline(),
      );
    return schema.build();
  }

  static override table(table: Table) {
    return table
      .columns(
        IdColumn.make(),
        TextColumn.make('name').searchable().sortable(),
        TextColumn.make('amount').sortable(),
        TextColumn.make('amountType').label('Type').sortable(),
        TextColumn.make('scope').sortable(),
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
        TextColumn.make('amount'),
        TextColumn.make('amountType').label('Computation'),
        TextColumn.make('scope'),
        BooleanColumn.make('active'),
        DateTimeColumn.make('createdAt'),
      )
      .build();
  }
}
