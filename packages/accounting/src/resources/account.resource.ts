import {
  BooleanColumn,
  BooleanField,
  DateTimeColumn,
  IdColumn,
  Resource,
  Schema,
  SelectField,
  Table,
  TextColumn,
  TextField,
  InfolistBuilder,
} from '@nodeweaver/loom';

export abstract class AccountResourceBase extends Resource {
  static override slug = 'accounts';
  static override label = 'Chart of accounts';
  static override singularLabel = 'Account';
  static override icon = 'book';
  static override navigationGroup = 'Accounting';
  static override navigationSection = 'Configuration';
  static override navigationSort = 10;
  static override recordTitleField = 'name';
  static override companyScoped = true;

  static override form(schema: Schema) {
    schema
      .section('identity', 'Account')
      .columns(2)
      .fields(
        TextField.make('code').required().searchable().placeholder('1100'),
        TextField.make('name').required().searchable(),
        SelectField.make('accountType')
          .label('Type')
          .options([
            { label: 'Asset', value: 'asset' },
            { label: 'Liability', value: 'liability' },
            { label: 'Equity', value: 'equity' },
            { label: 'Income', value: 'income' },
            { label: 'Expense', value: 'expense' },
            { label: 'Off-balance', value: 'off_balance' },
          ]),
        BooleanField.make('reconcile').label('Allow reconciliation').inline(),
        BooleanField.make('active').label('Active').inline(),
      );
    return schema.build();
  }

  static override table(table: Table) {
    return table
      .columns(
        IdColumn.make(),
        TextColumn.make('code').searchable().sortable(),
        TextColumn.make('name').searchable().sortable(),
        TextColumn.make('accountType').label('Type').sortable(),
        BooleanColumn.make('reconcile').sortable(),
        BooleanColumn.make('active').sortable(),
        DateTimeColumn.make('createdAt').sortable(),
      )
      .defaultSort('code', 'asc')
      .build();
  }

  static override detail(infolist: InfolistBuilder) {
    return infolist
      .section('identity', 'Account')
      .entries(
        TextColumn.make('code'),
        TextColumn.make('name'),
        TextColumn.make('accountType').label('Type'),
        BooleanColumn.make('reconcile'),
        BooleanColumn.make('active'),
        DateTimeColumn.make('createdAt'),
      )
      .build();
  }
}
