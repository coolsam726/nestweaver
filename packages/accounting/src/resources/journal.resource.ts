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

export abstract class JournalResourceBase extends Resource {
  static override slug = 'account-journals';
  static override label = 'Journals';
  static override singularLabel = 'Journal';
  static override icon = 'book-open';
  static override navigationGroup = 'Accounting';
  static override navigationSection = 'Configuration';
  static override navigationSort = 20;
  static override recordTitleField = 'name';
  static override companyScoped = true;

  static override form(schema: Schema) {
    schema
      .section('identity', 'Journal')
      .columns(2)
      .fields(
        TextField.make('name').required().searchable(),
        TextField.make('code').searchable().placeholder('INV'),
        SelectField.make('journalType')
          .label('Type')
          .options([
            { label: 'Sales', value: 'sale' },
            { label: 'Purchase', value: 'purchase' },
            { label: 'Cash', value: 'cash' },
            { label: 'Bank', value: 'bank' },
            { label: 'Miscellaneous', value: 'general' },
            { label: 'Inventory', value: 'inventory' },
          ]),
        RelationField.make('defaultAccountId')
          .manyToOne('accounts', 'name')
          .label('Default account'),
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
        TextColumn.make('journalType').label('Type').sortable(),
        RelationColumn.make('defaultAccountId')
          .manyToOne('accounts', 'name')
          .label('Default account'),
        BooleanColumn.make('active').sortable(),
        DateTimeColumn.make('createdAt').sortable(),
      )
      .defaultSort('name', 'asc')
      .build();
  }

  static override detail(infolist: InfolistBuilder) {
    return infolist
      .section('identity', 'Journal')
      .entries(
        TextColumn.make('name'),
        TextColumn.make('code'),
        TextColumn.make('journalType').label('Type'),
        RelationColumn.make('defaultAccountId')
          .manyToOne('accounts', 'name')
          .label('Default account'),
        BooleanColumn.make('active'),
        DateTimeColumn.make('createdAt'),
      )
      .build();
  }
}
